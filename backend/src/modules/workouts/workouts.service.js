import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, exercises, feedback, trainers, workouts } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

async function attachExercises(rows) {
  const allExercises = await db.select().from(exercises).where(isNull(exercises.deletedAt));
  return rows.map((workout) => ({
    ...workout,
    exercises: allExercises
      .filter((exercise) => exercise.workoutId === workout.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export async function list(user) {
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    const rows = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.trainerId, trainer.id), isNull(workouts.deletedAt)));
    return attachExercises(rows);
  }

  if (user.role === "client") {
    const client = await clientForUser(user);
    const rows = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.clientId, client.id), isNull(workouts.deletedAt)));
    return attachExercises(rows);
  }

  const rows = await db.select().from(workouts).where(isNull(workouts.deletedAt));
  return attachExercises(rows);
}

export async function create(user, input) {
  const trainer = await trainerForUser(user);
  const now = new Date().toISOString();
  const workoutId = randomUUID();
  const [workout] = await db
    .insert(workouts)
    .values({
      id: workoutId,
      trainerId: trainer.id,
      clientId: input.clientId,
      name: input.name,
      type: input.type,
      durationMinutes: input.durationMinutes ?? 45,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (input.exercises.length) {
    await db.insert(exercises).values(
      input.exercises.map((exercise, index) => ({
        id: randomUUID(),
        workoutId,
        ...exercise,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const [result] = await attachExercises([workout]);
  return result;
}

export async function getClientWorkout(user) {
  const client = await clientForUser(user);
  const rows = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.clientId, client.id), isNull(workouts.deletedAt)));
  const hydrated = await attachExercises(
    rows.length
      ? rows
      : await db.select().from(workouts).where(isNull(workouts.deletedAt)).limit(1),
  );
  if (!hydrated.length) throw new AppError("Workout not found", 404);
  return hydrated[0];
}

export async function submitFeedback(user, exerciseId, input) {
  const client = await clientForUser(user);
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).limit(1);
  if (!exercise) throw new AppError("Exercise not found", 404);

  const now = new Date().toISOString();
  const [entry] = await db
    .insert(feedback)
    .values({
      id: randomUUID(),
      clientId: client.id,
      workoutId: input.workoutId,
      exerciseId,
      difficulty: input.difficulty,
      energy: input.energy,
      issue: input.issue,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return entry;
}

export async function listFeedback(user, filter = "All") {
  let rows = await db
    .select({
      id: feedback.id,
      clientId: feedback.clientId,
      clientName: clients.name,
      workoutId: feedback.workoutId,
      workoutName: workouts.name,
      exerciseId: feedback.exerciseId,
      difficulty: feedback.difficulty,
      energy: feedback.energy,
      issue: feedback.issue,
      notes: feedback.notes,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .innerJoin(clients, eq(feedback.clientId, clients.id))
    .leftJoin(workouts, eq(feedback.workoutId, workouts.id))
    .where(isNull(feedback.deletedAt));

  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    rows = rows
      .filter((row) => (row.workoutId ? true : true))
      .filter((row) => {
        const client = row.clientId;
        return client;
      });
    const trainerClients = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.trainerId, trainer.id));
    const allowed = new Set(trainerClients.map((client) => client.id));
    rows = rows.filter((row) => allowed.has(row.clientId));
  }

  return rows.filter((row) => {
    const tone = feedbackTone(row);
    if (filter === "Issues") return tone === "destructive";
    if (filter === "Hard + Low") return tone === "warning";
    if (filter === "Normal") return tone === "success";
    return true;
  });
}

function feedbackTone(entry) {
  if (entry.issue && entry.issue !== "No issue") return "destructive";
  if (entry.difficulty === "Hard" && entry.energy === "Low") return "warning";
  return "success";
}
