import { and, desc, eq, gte, isNull, like, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, mealLogs } from "../../db/schema.js";
import { uploadMealImage } from "../../services/imagekit.service.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

export async function list(user, query = {}) {
  const where = [isNull(mealLogs.deletedAt)];
  if (query.type && query.type !== "all") where.push(eq(mealLogs.type, query.type));
  if (query.clientId) where.push(eq(mealLogs.clientId, query.clientId));
  if (query.startDate) {
    where.push(gte(mealLogs.loggedAt, dayStart(query.startDate).toISOString()));
  }
  if (query.endDate) {
    where.push(lte(mealLogs.loggedAt, dayEnd(query.endDate).toISOString()));
  }
  if (!query.startDate && !query.endDate && query.range && query.range !== "all") {
    where.push(gte(mealLogs.loggedAt, rangeStart(query.range).toISOString()));
  }
  if (query.search) where.push(like(clients.name, `%${query.search}%`));

  if (user.role === "client") {
    const client = await clientForUser(user);
    where.push(eq(mealLogs.clientId, client.id));
  }

  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    where.push(eq(clients.trainerId, trainer.id));
  }

  const statement = db
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
    .where(and(...where))
    .orderBy(desc(mealLogs.loggedAt), desc(mealLogs.id));

  if (!query.limit) return statement;

  const page = query.page ?? 1;
  const limit = query.limit;
  const rows = await statement.limit(limit + 1).offset((page - 1) * limit);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    page,
    nextPage: hasMore ? page + 1 : null,
    hasMore,
  };
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

function rangeStart(range) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (range === "week") date.setDate(date.getDate() - 6);
  return date;
}

function dayStart(value) {
  const date = parseDateInput(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayEnd(value) {
  const date = parseDateInput(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
