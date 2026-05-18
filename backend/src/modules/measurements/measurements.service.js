import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, goals, measurements } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

export async function list(user, query = {}) {
  let clientId = query.clientId;
  if (user.role === "client") clientId = (await clientForUser(user)).id;
  if (user.role === "trainer") {
    if (!clientId) throw new AppError("clientId query parameter is required", 400);
    await ensureTrainerOwnsClient(user, clientId);
  }

  return db.select().from(measurements).where(eq(measurements.clientId, clientId));
}

export async function create(user, input) {
  let clientId = input.clientId;
  if (user.role === "client") clientId = (await clientForUser(user)).id;
  if (user.role === "trainer") await ensureTrainerOwnsClient(user, clientId);
  if (!clientId) throw new AppError("clientId is required", 400);

  const now = new Date().toISOString();
  const [measurement] = await db
    .insert(measurements)
    .values({
      id: randomUUID(),
      clientId,
      weight: input.weight,
      chest: input.chest,
      waist: input.waist,
      arms: input.arms,
      upperBelly: input.upperBelly,
      lowerBelly: input.lowerBelly,
      hip: input.hip,
      thigh: input.thigh,
      calf: input.calf,
      measuredAt: input.measuredAt ?? now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (typeof input.weight === "number") {
    const clientGoals = await db.select().from(goals).where(eq(goals.clientId, clientId));
    const weightGoal = clientGoals.find((goal) => goal.unit === "kg" && goal.reverse);
    if (weightGoal) {
      await db
        .update(goals)
        .set({ currentValue: input.weight, updatedAt: now })
        .where(eq(goals.id, weightGoal.id));
    }
  }

  return measurement;
}

async function ensureTrainerOwnsClient(user, clientId) {
  if (!clientId) throw new AppError("clientId is required", 400);
  const trainer = await trainerForUser(user);
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client || client.trainerId !== trainer.id) throw new AppError("Client not found", 404);
  return client;
}
