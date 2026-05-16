import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { clients, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";

export async function list({ status }) {
  const rows = await db
    .select({
      id: trainers.id,
      userId: trainers.userId,
      name: users.name,
      email: users.email,
      status: trainers.status,
      joinedAt: trainers.joinedAt,
      specialization: trainers.specialization,
      createdAt: trainers.createdAt,
    })
    .from(trainers)
    .innerJoin(users, eq(trainers.userId, users.id))
    .where(status && status !== "All" ? eq(trainers.status, status) : isNull(trainers.deletedAt));

  const counts = await db.select({ trainerId: clients.trainerId, id: clients.id }).from(clients);
  return rows.map((trainer) => ({
    ...trainer,
    clients: counts.filter((client) => client.trainerId === trainer.id).length,
  }));
}

export async function getById(id) {
  const [trainer] = await db
    .select({
      id: trainers.id,
      userId: trainers.userId,
      name: users.name,
      email: users.email,
      status: trainers.status,
      joinedAt: trainers.joinedAt,
      specialization: trainers.specialization,
      bio: trainers.bio,
    })
    .from(trainers)
    .innerJoin(users, eq(trainers.userId, users.id))
    .where(and(eq(trainers.id, id), isNull(trainers.deletedAt)))
    .limit(1);
  if (!trainer) throw new AppError("Trainer not found", 404);
  return trainer;
}

export async function updateStatus(id, status) {
  const [trainer] = await db.select().from(trainers).where(eq(trainers.id, id)).limit(1);
  if (!trainer) throw new AppError("Trainer not found", 404);

  const now = new Date().toISOString();
  const [updated] = await db
    .update(trainers)
    .set({ status, updatedAt: now })
    .where(eq(trainers.id, id))
    .returning();

  await db
    .update(users)
    .set({ approvalStatus: status, updatedAt: now })
    .where(eq(users.id, trainer.userId));

  return getById(updated.id);
}
