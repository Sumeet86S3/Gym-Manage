import { eq, inArray } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  attendance,
  clients,
  exercises,
  feedback,
  goals,
  mealLogs,
  measurements,
  notifications,
  payments,
  refreshSessions,
  trainers,
  users,
  workouts,
} from "../db/schema.js";
import { notFound } from "../utils/AppError.js";

export async function deleteClientCascade(clientId, tx = db) {
  const [client] = await tx.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw notFound("Client");

  const deleted = await deleteClientsCascade([client], tx);
  return { deleted: true, ...deleted };
}

export async function deleteTrainerCascade(trainerId) {
  return db.transaction(async (tx) => {
    const [trainer] = await tx.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
    if (!trainer) throw notFound("Trainer");

    const trainerClients = await tx.select().from(clients).where(eq(clients.trainerId, trainer.id));
    const deletedClients = await deleteClientsCascade(trainerClients, tx);

    const trainerWorkoutRows = await tx
      .select({ id: workouts.id })
      .from(workouts)
      .where(eq(workouts.trainerId, trainer.id));
    await deleteWorkoutsByIds(
      trainerWorkoutRows.map((workout) => workout.id),
      tx,
    );

    await deleteUsersByIds([trainer.userId], tx);
    await tx.delete(trainers).where(eq(trainers.id, trainer.id));

    return {
      deleted: true,
      trainerId: trainer.id,
      clientsDeleted: deletedClients.clientsDeleted,
      workoutsDeleted: deletedClients.workoutsDeleted + trainerWorkoutRows.length,
    };
  });
}

async function deleteClientsCascade(clientRows, tx) {
  const clientIds = clientRows.map((client) => client.id);
  const clientUserIds = clientRows.map((client) => client.userId).filter(Boolean);
  if (!clientIds.length) return { clientsDeleted: 0, workoutsDeleted: 0 };

  await tx.delete(feedback).where(inArray(feedback.clientId, clientIds));

  const workoutRows = await tx
    .select({ id: workouts.id })
    .from(workouts)
    .where(inArray(workouts.clientId, clientIds));
  await deleteWorkoutsByIds(
    workoutRows.map((workout) => workout.id),
    tx,
  );

  await tx.delete(goals).where(inArray(goals.clientId, clientIds));
  await tx.delete(payments).where(inArray(payments.clientId, clientIds));
  await tx.delete(measurements).where(inArray(measurements.clientId, clientIds));
  await tx.delete(mealLogs).where(inArray(mealLogs.clientId, clientIds));
  await tx.delete(attendance).where(inArray(attendance.clientId, clientIds));
  await tx.delete(clients).where(inArray(clients.id, clientIds));
  await deleteUsersByIds(clientUserIds, tx);

  return { clientsDeleted: clientIds.length, workoutsDeleted: workoutRows.length };
}

async function deleteWorkoutsByIds(workoutIds, tx) {
  if (!workoutIds.length) return;
  await tx.delete(feedback).where(inArray(feedback.workoutId, workoutIds));
  await tx.delete(exercises).where(inArray(exercises.workoutId, workoutIds));
  await tx.delete(workouts).where(inArray(workouts.id, workoutIds));
}

async function deleteUsersByIds(userIds, tx) {
  if (!userIds.length) return;
  await tx.delete(refreshSessions).where(inArray(refreshSessions.userId, userIds));
  await tx.delete(notifications).where(inArray(notifications.userId, userIds));
  await tx.delete(users).where(inArray(users.id, userIds));
}
