import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function tokenPayload(user) {
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
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

  return { ...tokenPayload(user), trainer };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError("Refresh token required", 401);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user || user.deletedAt || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid refresh token", 401);
  }

  return tokenPayload(user);
}

export async function revokeRefreshTokens(userId) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;
  await db
    .update(users)
    .set({ tokenVersion: user.tokenVersion + 1, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
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
