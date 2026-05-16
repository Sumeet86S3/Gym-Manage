import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { attendance, clients } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { trainerForUser } from "../clients/clients.service.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function list(user, date = today()) {
  const trainer = await trainerForUser(user);
  const roster = await db.select().from(clients).where(eq(clients.trainerId, trainer.id));
  const entries = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.trainerId, trainer.id), eq(attendance.date, date)));
  return { date, clients: roster, entries };
}

export async function toggle(user, { clientId, date = today() }) {
  const trainer = await trainerForUser(user);
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainer.id)))
    .limit(1);
  if (!client) throw new AppError("Client not found", 404);

  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.clientId, clientId), eq(attendance.date, date)))
    .limit(1);

  if (existing) {
    await db.delete(attendance).where(eq(attendance.id, existing.id));
    const [updatedClient] = await db
      .update(clients)
      .set({ streak: Math.max(0, client.streak - 1), updatedAt: new Date().toISOString() })
      .where(eq(clients.id, clientId))
      .returning();
    return { marked: false, entry: existing, client: updatedClient };
  }

  const now = new Date().toISOString();
  const [entry] = await db
    .insert(attendance)
    .values({
      id: randomUUID(),
      clientId,
      trainerId: trainer.id,
      date,
      markedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const [updatedClient] = await db
    .update(clients)
    .set({
      streak: client.streak + 1,
      lastVisit: date === today() ? "Today" : date,
      updatedAt: now,
    })
    .where(eq(clients.id, clientId))
    .returning();
  return { marked: true, entry, client: updatedClient };
}
