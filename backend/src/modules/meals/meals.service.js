import { and, eq, gte, isNull, like } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, mealLogs } from "../../db/schema.js";
import { uploadMealImage } from "../../services/imagekit.service.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

const DAY_MS = 1000 * 60 * 60 * 24;

export async function list(user, query = {}) {
  const where = [isNull(mealLogs.deletedAt)];
  if (query.type && query.type !== "all") where.push(eq(mealLogs.type, query.type));
  if (query.range && query.range !== "all") {
    const days = query.range === "week" ? 7 : 1;
    where.push(gte(mealLogs.loggedAt, new Date(Date.now() - DAY_MS * days).toISOString()));
  }

  let rows = await db
    .select({
      id: mealLogs.id,
      clientId: mealLogs.clientId,
      clientName: clients.name,
      type: mealLogs.type,
      note: mealLogs.note,
      imageUrl: mealLogs.imageUrl,
      loggedAt: mealLogs.loggedAt,
      createdAt: mealLogs.createdAt,
    })
    .from(mealLogs)
    .innerJoin(clients, eq(mealLogs.clientId, clients.id))
    .where(and(...where));

  if (user.role === "client") {
    const client = await clientForUser(user);
    rows = rows.filter((row) => row.clientId === client.id);
  }

  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    rows = rows.filter((row) => {
      const client = rows.find((candidate) => candidate.clientId === row.clientId);
      return client && true;
    });
    const trainerClients = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.trainerId, trainer.id));
    const allowed = new Set(trainerClients.map((client) => client.id));
    rows = rows.filter((row) => allowed.has(row.clientId));
  }

  if (query.search)
    rows = rows.filter((row) => row.clientName.toLowerCase().includes(query.search.toLowerCase()));
  return rows;
}

export async function create(user, input) {
  const client = await clientForUser(user);
  const now = new Date().toISOString();
  const image = await uploadMealImage({
    imageData: input.imageData,
    fileName: input.imageFileName,
  });
  const [meal] = await db
    .insert(mealLogs)
    .values({
      id: randomUUID(),
      clientId: client.id,
      type: input.type,
      note: input.note,
      imageUrl: image.url,
      loggedAt: input.loggedAt ?? now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return meal;
}
