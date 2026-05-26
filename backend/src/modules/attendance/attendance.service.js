import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { attendance, clients } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function list(user, date = today()) {
  if (user.role === "client") {
    const client = await clientForUser(user);
    const entries = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.clientId, client.id), eq(attendance.date, date)));
    return {
      date,
      client,
      clients: [client],
      entries: entries.map((entry) => entryWithClient(entry, client)),
      todayEntry: entries[0] ? entryWithClient(entries[0], client) : null,
    };
  }

  const trainer = await trainerForUser(user);
  const roster = await db.select().from(clients).where(eq(clients.trainerId, trainer.id));
  const entries = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.trainerId, trainer.id), eq(attendance.date, date)));
  return {
    date,
    clients: roster,
    entries: entries.map((entry) =>
      entryWithClient(
        entry,
        roster.find((client) => client.id === entry.clientId),
      ),
    ),
  };
}

export async function toggle(user, { clientId, date = today() }) {
  const { trainerId, client } = await attendanceTarget(user, clientId);
  if (!client) throw new AppError("Client not found", 404);
  const targetClientId = client.id;

  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.clientId, targetClientId), eq(attendance.date, date)))
    .limit(1);

  if (existing) {
    return {
      marked: true,
      alreadyMarked: true,
      entry: entryWithClient(existing, client),
      client,
    };
  }

  const now = new Date().toISOString();
  let entry;
  try {
    [entry] = await db
      .insert(attendance)
      .values({
        id: randomUUID(),
        clientId: targetClientId,
        trainerId,
        date,
        markedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    const [raceWinner] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.clientId, targetClientId), eq(attendance.date, date)))
      .limit(1);
    if (raceWinner) {
      return {
        marked: true,
        alreadyMarked: true,
        entry: entryWithClient(raceWinner, client),
        client,
      };
    }
    throw error;
  }
  const [updatedClient] = await db
    .update(clients)
    .set({
      streak: client.streak + 1,
      lastVisit: date === today() ? "Today" : date,
      updatedAt: now,
    })
    .where(eq(clients.id, client.id))
    .returning();
  return {
    marked: true,
    alreadyMarked: false,
    entry: entryWithClient(entry, updatedClient),
    client: updatedClient,
  };
}

async function attendanceTarget(user, requestedClientId) {
  if (user.role === "client") {
    const client = await clientForUser(user);
    if (requestedClientId && requestedClientId !== client.id) {
      throw new AppError("Client not found", 404);
    }
    if (!client.trainerId) throw new AppError("Trainer assignment not found", 404);
    return { trainerId: client.trainerId, client };
  }

  const trainer = await trainerForUser(user);
  if (!requestedClientId) throw new AppError("Client is required", 400);
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, requestedClientId), eq(clients.trainerId, trainer.id)))
    .limit(1);
  return { trainerId: trainer.id, client };
}

function entryWithClient(entry, client) {
  return {
    ...entry,
    clientName: client?.name ?? "Client",
    status: "Marked",
  };
}
