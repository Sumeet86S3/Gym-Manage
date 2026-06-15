import { and, desc, eq, gte, inArray, isNull, like, lt, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, mealLogs } from "../../db/schema.js";
import { uploadMealImage } from "../../services/imagekit.service.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

const mealTypes = [
  "Warm water",
  "Breakfast",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Pre-Workout",
  "Post-Workout",
];

export async function list(user, query = {}) {
  const where = [isNull(mealLogs.deletedAt)];
  if (query.type && query.type !== "all") where.push(eq(mealLogs.type, query.type));
  if (query.clientId) where.push(eq(mealLogs.clientId, query.clientId));
  if (query.date) {
    where.push(gte(mealLogs.loggedAt, dayStart(query.date).toISOString()));
    where.push(lte(mealLogs.loggedAt, dayEnd(query.date).toISOString()));
  }
  if (!query.date && query.range && query.range !== "all") {
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

export async function missedSummary(user) {
  const ownedClients = await clientsForMealSummary(user);
  const activeClients = ownedClients.filter((client) => client.status === "Active");
  const todayStart = startOfToday();
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  if (activeClients.length === 0) {
    return {
      totalMissed: 0,
      clients: [],
    };
  }

  const clientIds = activeClients.map((client) => client.id);
  const rows = await db
    .select({
      clientId: mealLogs.clientId,
      type: mealLogs.type,
      loggedAt: mealLogs.loggedAt,
    })
    .from(mealLogs)
    .where(
      and(
        isNull(mealLogs.deletedAt),
        inArray(mealLogs.clientId, clientIds),
        lt(mealLogs.loggedAt, todayStart.toISOString()),
      ),
    );

  const loggedTypesByClientDate = new Map();
  for (const row of rows) {
    const clientDates = loggedTypesByClientDate.get(row.clientId) ?? new Map();
    const key = dateKey(new Date(row.loggedAt));
    const types = clientDates.get(key) ?? new Set();
    types.add(row.type);
    clientDates.set(key, types);
    loggedTypesByClientDate.set(row.clientId, clientDates);
  }

  const clientSummaries = activeClients
    .map((client) => {
      const missed = missedMealUpdates(
        client.joinedAt,
        yesterday,
        loggedTypesByClientDate.get(client.id),
      );
      return {
        clientId: client.id,
        clientName: client.name,
        missedCount: missed.count,
        lastMissedDate: missed.lastDate,
      };
    })
    .filter((client) => client.missedCount > 0)
    .sort((a, b) => b.missedCount - a.missedCount || a.clientName.localeCompare(b.clientName));

  return {
    totalMissed: clientSummaries.reduce((total, client) => total + client.missedCount, 0),
    clients: clientSummaries,
  };
}

async function clientsForMealSummary(user) {
  const where = [isNull(clients.deletedAt)];

  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    where.push(eq(clients.trainerId, trainer.id));
  }

  if (user.role === "client") {
    const client = await clientForUser(user);
    where.push(eq(clients.id, client.id));
  }

  return db
    .select({
      id: clients.id,
      name: clients.name,
      status: clients.status,
      joinedAt: clients.joinedAt,
    })
    .from(clients)
    .where(and(...where));
}

function rangeStart(range) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (range === "week") date.setDate(date.getDate() - 6);
  return date;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
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

function missedMealUpdates(joinedAt, yesterday, loggedTypesByDate = new Map()) {
  const date = parseDateInput(joinedAt.slice(0, 10));
  date.setHours(0, 0, 0, 0);
  let count = 0;
  let lastDate = null;

  while (date <= yesterday) {
    const key = dateKey(date);
    const loggedTypes = loggedTypesByDate.get(key) ?? new Set();
    const missedForDay = mealTypes.filter((type) => !loggedTypes.has(type)).length;
    if (missedForDay > 0) {
      count += missedForDay;
      lastDate = key;
    }
    date.setDate(date.getDate() + 1);
  }

  return { count, lastDate };
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
