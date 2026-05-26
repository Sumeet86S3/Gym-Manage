import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, goals } from "../../db/schema.js";
import { AppError, forbidden, notFound } from "../../utils/AppError.js";
import { assertTrainerOwnsClient } from "../../services/authorization.service.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

export async function list(user, query = {}) {
  let clientId = query.clientId;
  if (user.role === "client") {
    const client = await clientForUser(user);
    clientId = client.id;
  }

  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    if (clientId) {
      await assertTrainerOwnsClient(trainer.id, clientId);
      return db.select().from(goals).where(and(eq(goals.clientId, clientId), isNull(goals.deletedAt)));
    }

    return db
      .select({
        id: goals.id,
        clientId: goals.clientId,
        title: goals.title,
        startValue: goals.startValue,
        currentValue: goals.currentValue,
        targetValue: goals.targetValue,
        unit: goals.unit,
        reverse: goals.reverse,
        createdAt: goals.createdAt,
        updatedAt: goals.updatedAt,
        deletedAt: goals.deletedAt,
      })
      .from(goals)
      .innerJoin(clients, eq(goals.clientId, clients.id))
      .where(and(eq(clients.trainerId, trainer.id), isNull(clients.deletedAt), isNull(goals.deletedAt)));
  }

  const where = [isNull(goals.deletedAt)];
  if (clientId) where.push(eq(goals.clientId, clientId));
  return db.select().from(goals).where(and(...where));
}

export async function create(user, input) {
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    await assertTrainerOwnsClient(trainer.id, input.clientId);
  }

  const now = new Date().toISOString();
  const [goal] = await db
    .insert(goals)
    .values({ id: randomUUID(), ...input, createdAt: now, updatedAt: now })
    .returning();
  return goal;
}

export async function update(user, id, input) {
  const existing = await assertCanAccessGoal(user, id);
  if (input.clientId && input.clientId !== existing.clientId) {
    await assertCanAccessClient(user, input.clientId);
  }

  const [goal] = await db
    .update(goals)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(goals.id, id))
    .returning();
  return goal;
}

export async function remove(user, id) {
  await assertCanAccessGoal(user, id);
  await db.update(goals).set({ deletedAt: new Date().toISOString() }).where(eq(goals.id, id));
  return { deleted: true };
}

async function assertCanAccessGoal(user, id) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), isNull(goals.deletedAt)))
    .limit(1);
  if (!goal) throw notFound("Goal");

  await assertCanAccessClient(user, goal.clientId);
  return goal;
}

async function assertCanAccessClient(user, clientId) {
  if (user.role === "admin") return;
  if (user.role === "client") {
    const client = await clientForUser(user);
    if (client.id !== clientId) throw forbidden("Goal does not belong to this client");
    return;
  }
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    await assertTrainerOwnsClient(trainer.id, clientId);
    return;
  }
  throw new AppError("Unsupported role", 403);
}
