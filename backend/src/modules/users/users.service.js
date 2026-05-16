import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { clients, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function updateMe(user, input) {
  if (input.email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase()))
      .limit(1);
    if (existing && existing.id !== user.id) throw new AppError("Email is already registered", 409);
  }

  const update = {
    ...input,
    ...(input.email ? { email: input.email.toLowerCase() } : {}),
    updatedAt: new Date().toISOString(),
  };

  const [updated] = await db.update(users).set(update).where(eq(users.id, user.id)).returning();

  if (updated.role === "client") {
    await db
      .update(clients)
      .set({ name: updated.name, email: updated.email })
      .where(eq(clients.userId, updated.id));
  }

  return sanitize(updated);
}

export async function changePassword(user, { currentPassword, newPassword }) {
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new AppError("Current password is incorrect", 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, tokenVersion: user.tokenVersion + 1, updatedAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  return { updated: true };
}

export async function listUsers() {
  const rows = await db.select().from(users);
  return rows.map(sanitize);
}
