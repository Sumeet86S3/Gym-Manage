import { and, eq, isNull, like } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, trainers } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";

export async function trainerForUser(user) {
  const [trainer] = await db.select().from(trainers).where(eq(trainers.userId, user.id)).limit(1);
  if (!trainer) throw new AppError("Trainer profile not found", 404);
  return trainer;
}

export async function clientForUser(user) {
  const [client] = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  if (!client) throw new AppError("Client profile not found", 404);
  return client;
}

export async function list(user, query = {}) {
  const where = [isNull(clients.deletedAt)];
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    where.push(eq(clients.trainerId, trainer.id));
  } else if (query.trainerId) {
    where.push(eq(clients.trainerId, query.trainerId));
  }
  if (query.q) where.push(like(clients.name, `%${query.q}%`));

  return db
    .select()
    .from(clients)
    .where(and(...where));
}

export async function getById(user, id) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);
  if (!client) throw new AppError("Client not found", 404);
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    if (client.trainerId !== trainer.id) throw new AppError("Client not found", 404);
  }
  return client;
}

export async function create(user, input) {
  const trainer = await trainerForUser(user);
  const now = new Date().toISOString();
  const [client] = await db
    .insert(clients)
    .values({
      id: randomUUID(),
      trainerId: trainer.id,
      name: input.name,
      email: input.email.toLowerCase(),
      goal: input.goal ?? "General fitness",
      status: "Active",
      lastVisit: "Today",
      joinedAt: now.slice(0, 10),
      streak: 0,
      plan: input.plan ?? "Standard Monthly",
      paymentStatus: input.paymentStatus ?? "Paid",
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return client;
}

export async function update(user, id, input) {
  await getById(user, id);
  const [updated] = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(clients.id, id))
    .returning();
  return updated;
}

export async function remove(user, id) {
  await getById(user, id);
  await db.update(clients).set({ deletedAt: new Date().toISOString() }).where(eq(clients.id, id));
  return { deleted: true };
}
