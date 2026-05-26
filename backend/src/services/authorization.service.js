import { and, eq, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import { clients, exercises, workouts } from "../db/schema.js";
import { forbidden, notFound } from "../utils/AppError.js";

export async function assertTrainerOwnsClient(trainerId, clientId) {
  if (!clientId) throw notFound("Client");

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
    .limit(1);

  if (!client) throw notFound("Client");
  if (client.trainerId !== trainerId) throw forbidden("Trainer does not own this client");
  return client;
}

export async function assertWorkoutBelongsToClient(workoutId, clientId) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), isNull(workouts.deletedAt)))
    .limit(1);

  if (!workout) throw notFound("Workout");
  if (workout.clientId !== clientId) throw forbidden("Workout does not belong to this client");
  return workout;
}

export async function assertExerciseBelongsToWorkout(exerciseId, workoutId) {
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), isNull(exercises.deletedAt)))
    .limit(1);

  if (!exercise) throw notFound("Exercise");
  if (exercise.workoutId !== workoutId) throw forbidden("Exercise does not belong to this workout");
  return exercise;
}
