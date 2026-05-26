import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, refreshSessions, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function tokenPayload(user, sessionId = randomUUID()) {
  const session = {
    sessionId,
    tokenId: randomUUID(),
  };
  const refreshToken = signRefreshToken(user, session);
  await upsertRefreshSession(user.id, {
    id: sessionId,
    tokenId: session.tokenId,
    tokenHash: hashToken(refreshToken),
  });

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export async function login({ email, password, role }) {
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

  return tokenPayload(updated);
}

export async function signupTrainer({ name, email, password, specialization }) {
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

  const tokens = await tokenPayload(user);
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
  if (
    !session ||
    session.userId !== payload.sub ||
    session.tokenId !== payload.jti ||
    session.revokedAt ||
    session.expiresAt <= new Date().toISOString()
  ) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (session.tokenHash !== hashToken(refreshToken)) {
    await revokeRefreshTokens(payload.sub);
    throw new AppError("Invalid refresh token", 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || user.deletedAt || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid refresh token", 401);
  }

  return tokenPayload(user, session.id);
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
        expiresAt,
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
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
