import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";
import { clients, refreshSessions, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";

const SALT_ROUNDS = 12;
const PERSISTENT_REFRESH_MS = env.REFRESH_COOKIE_MAX_AGE_MS;
const SESSION_REFRESH_MS = env.SESSION_REFRESH_COOKIE_MAX_AGE_MS;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function tokenPayload(user, options = {}) {
  const persistent = Boolean(options.persistent);
  const maxAgeMs = persistent ? PERSISTENT_REFRESH_MS : SESSION_REFRESH_MS;
  const session = {
    sessionId: options.sessionId ?? randomUUID(),
    tokenId: randomUUID(),
  };
  const refreshToken = signRefreshToken(
    user,
    session,
    persistent ? env.JWT_REFRESH_EXPIRES_IN : env.JWT_REFRESH_SESSION_EXPIRES_IN,
  );
  await upsertRefreshSession(user.id, {
    id: session.sessionId,
    tokenId: session.tokenId,
    tokenHash: hashToken(refreshToken),
    persistent,
    userAgent: options.userAgent,
    expiresAt: new Date(Date.now() + maxAgeMs).toISOString(),
  });

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
    cookieMaxAgeMs: maxAgeMs,
  };
}

export async function login({ email, password, role, rememberMe = false }, context = {}) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user || user.deletedAt) throw new AppError("Invalid email or password", 401);
  if (role && user.role !== role) throw new AppError(`This account is not a ${role} account`, 403);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new AppError("Invalid email or password", 401);

  const [updated] = await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(users.id, user.id))
    .returning();

  return tokenPayload(updated, { persistent: rememberMe, userAgent: context.userAgent });
}

export async function signupTrainer({ name, email, password, specialization }, context = {}) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (existing.length) throw new AppError("Email is already registered", 409);

  const userId = randomUUID();
  const trainerId = randomUUID();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "trainer",
      approvalStatus: "Pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [trainer] = await db
    .insert(trainers)
    .values({
      id: trainerId,
      userId,
      specialization,
      status: "Pending",
      joinedAt: now.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const tokens = await tokenPayload(user, { userAgent: context.userAgent });
  return { ...tokens, trainer };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError("Refresh token required", 401);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  if (!payload.sid || !payload.jti) throw new AppError("Invalid refresh token", 401);

  const [session] = await db
    .select()
    .from(refreshSessions)
    .where(eq(refreshSessions.id, payload.sid))
    .limit(1);
  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date().toISOString()) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (session.tokenId !== payload.jti || session.tokenHash !== hashToken(refreshToken)) {
    await revokeRefreshTokens(payload.sub);
    throw new AppError("Invalid refresh token", 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || user.deletedAt || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid refresh token", 401);
  }

  return tokenPayload(user, {
    sessionId: session.id,
    persistent: session.persistent,
    userAgent: session.userAgent,
  });
}

export async function revokeRefreshTokens(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;
  const now = new Date().toISOString();
  await db
    .update(users)
    .set({ tokenVersion: user.tokenVersion + 1, updatedAt: now })
    .where(eq(users.id, userId));
  await db
    .update(refreshSessions)
    .set({ revokedAt: now, updatedAt: now })
    .where(eq(refreshSessions.userId, userId));
}

export async function revokeRefreshSession(refreshToken, userId) {
  if (!refreshToken) return;
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }
  if (!payload.sid || (userId && payload.sub !== userId)) return;
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(refreshSessions.id, payload.sid));
}

export async function me(user) {
  const safe = sanitizeUser(user);
  if (user.role === "trainer") {
    const [trainer] = await db.select().from(trainers).where(eq(trainers.userId, user.id)).limit(1);
    return { ...safe, trainer };
  }
  if (user.role === "client") {
    const [client] = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
    return { ...safe, client };
  }
  return safe;
}

async function upsertRefreshSession(userId, session) {
  const now = new Date().toISOString();
  const [existing] = await db
    .select({ id: refreshSessions.id })
    .from(refreshSessions)
    .where(eq(refreshSessions.id, session.id))
    .limit(1);

  if (existing) {
    await db
      .update(refreshSessions)
      .set({
        tokenId: session.tokenId,
        tokenHash: session.tokenHash,
        persistent: session.persistent,
        userAgent: session.userAgent,
        lastUsedAt: now,
        expiresAt: session.expiresAt,
        updatedAt: now,
      })
      .where(eq(refreshSessions.id, session.id));
    return;
  }

  await db.insert(refreshSessions).values({
    id: session.id,
    userId,
    tokenId: session.tokenId,
    tokenHash: session.tokenHash,
    persistent: session.persistent,
    userAgent: session.userAgent,
    lastUsedAt: now,
    expiresAt: session.expiresAt,
    createdAt: now,
    updatedAt: now,
  });
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
