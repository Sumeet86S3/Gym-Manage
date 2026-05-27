import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars";
process.env.TURSO_DATABASE_URL = `file:auth-session-test-${Date.now()}.db`;
process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
process.env.IMAGEKIT_PRIVATE_KEY = "test-private";

await import("../scripts/migrate.js");

const { db } = await import("../src/config/db.js");
const { refreshSessions, users } = await import("../src/db/schema.js");
const authService = await import("../src/modules/auth/auth.service.js");

const now = new Date().toISOString();
const password = "correct-password";
const userId = randomUUID();

await db.insert(users).values({
  id: userId,
  name: "Session User",
  email: "session@test.local",
  passwordHash: await bcrypt.hash(password, 4),
  role: "admin",
  approvalStatus: "Approved",
  tokenVersion: 0,
  createdAt: now,
  updatedAt: now,
});

test("refresh rotates token id and rejects replayed refresh tokens", async () => {
  const login = await authService.login({
    email: "session@test.local",
    password,
    role: "admin",
    rememberMe: true,
  });

  const [initialSession] = await db
    .select()
    .from(refreshSessions)
    .where(eq(refreshSessions.userId, userId))
    .limit(1);

  const rotated = await authService.refresh(login.refreshToken);
  const [rotatedSession] = await db
    .select()
    .from(refreshSessions)
    .where(eq(refreshSessions.id, initialSession.id))
    .limit(1);

  assert.notEqual(rotatedSession.tokenId, initialSession.tokenId);
  assert.equal(rotatedSession.revokedAt, null);
  assert.ok(rotated.refreshToken);

  await assert.rejects(
    authService.refresh(login.refreshToken),
    (error) => error.statusCode === 401,
  );

  const [revokedSession] = await db
    .select()
    .from(refreshSessions)
    .where(eq(refreshSessions.id, initialSession.id))
    .limit(1);
  assert.ok(revokedSession.revokedAt);
});

test("current-session logout revokes only the matching refresh session", async () => {
  const first = await authService.login({
    email: "session@test.local",
    password,
    role: "admin",
    rememberMe: false,
  });
  const second = await authService.login({
    email: "session@test.local",
    password,
    role: "admin",
    rememberMe: false,
  });

  await authService.revokeRefreshSession(first.refreshToken, userId);

  await assert.rejects(
    authService.refresh(first.refreshToken),
    (error) => error.statusCode === 401,
  );
  await assert.doesNotReject(authService.refresh(second.refreshToken));
});
