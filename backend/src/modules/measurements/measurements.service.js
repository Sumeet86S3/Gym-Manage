import { and, eq, gte, lt } from "drizzle-orm";
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
  const measuredAt = input.measuredAt ?? now;
  const existing = await findForClientDate(clientId, measuredAt);
  if (existing) {
    return update(user, existing.id, { ...input, clientId, measuredAt });
  }

  const [measurement] = await db
    .insert(measurements)
    .values({
      id: randomUUID(),
      clientId,
      ...measurementValues(input),
      measuredAt,
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

export async function update(user, id, input) {
  const existing = await findAccessibleMeasurement(user, id);
  const now = new Date().toISOString();
  const nextClientId = input.clientId ?? existing.clientId;
  if (nextClientId !== existing.clientId) {
    if (user.role !== "trainer") throw new AppError("Clients cannot reassign measurements", 403);
    await ensureTrainerOwnsClient(user, nextClientId);
  }

  const measuredAt = input.measuredAt ?? existing.measuredAt;
  const duplicate = await findForClientDate(nextClientId, measuredAt, id);
  if (duplicate) throw new AppError("A measurement already exists for this client and date", 409);

  const [measurement] = await db
    .update(measurements)
    .set({
      clientId: nextClientId,
      ...measurementValues(input),
      measuredAt,
      updatedAt: now,
    })
    .where(eq(measurements.id, id))
    .returning();

  if (typeof input.weight === "number") {
    const clientGoals = await db.select().from(goals).where(eq(goals.clientId, nextClientId));
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

export async function remove(user, id) {
  await findAccessibleMeasurement(user, id);
  await db.delete(measurements).where(eq(measurements.id, id));
}

async function ensureTrainerOwnsClient(user, clientId) {
  if (!clientId) throw new AppError("clientId is required", 400);
  const trainer = await trainerForUser(user);
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client || client.trainerId !== trainer.id) throw new AppError("Client not found", 404);
  return client;
}

async function findAccessibleMeasurement(user, id) {
  const [measurement] = await db.select().from(measurements).where(eq(measurements.id, id)).limit(1);
  if (!measurement) throw new AppError("Measurement not found", 404);

  if (user.role === "client") {
    const client = await clientForUser(user);
    if (measurement.clientId !== client.id) throw new AppError("Measurement not found", 404);
  }

  if (user.role === "trainer") {
    await ensureTrainerOwnsClient(user, measurement.clientId);
  }

  return measurement;
}

async function findForClientDate(clientId, measuredAt, excludeId) {
  const date = new Date(measuredAt);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const rows = await db
    .select()
    .from(measurements)
    .where(
      and(
        eq(measurements.clientId, clientId),
        gte(measurements.measuredAt, start.toISOString()),
        lt(measurements.measuredAt, end.toISOString()),
      ),
    );
  return rows.find((row) => row.id !== excludeId) ?? null;
}

function measurementValues(input) {
  return {
    weight: input.weight,
    height: input.height,
    chest: input.chest,
    waist: input.waist,
    arms: input.arms,
    leftBicep: input.leftBicep,
    rightBicep: input.rightBicep,
    leftForearm: input.leftForearm,
    rightForearm: input.rightForearm,
    upperBelly: input.upperBelly,
    lowerBelly: input.lowerBelly,
    hip: input.hip,
    thigh: input.thigh,
    leftThigh: input.leftThigh,
    rightThigh: input.rightThigh,
    calf: input.calf,
    leftCalf: input.leftCalf,
    rightCalf: input.rightCalf,
    trainerNote: input.trainerNote,
    condition: input.condition,
    frontPhotoUrl: input.frontPhotoUrl === "" ? null : input.frontPhotoUrl,
    sidePhotoUrl: input.sidePhotoUrl === "" ? null : input.sidePhotoUrl,
    backPhotoUrl: input.backPhotoUrl === "" ? null : input.backPhotoUrl,
  };
}
