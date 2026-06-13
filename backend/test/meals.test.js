import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars";
process.env.TURSO_DATABASE_URL = `file:meals-test-${Date.now()}.db`;
process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
process.env.IMAGEKIT_PRIVATE_KEY = "test-private";

await import("../scripts/migrate.js");

const { db } = await import("../src/config/db.js");
const { clients, mealLogs, trainers, users } = await import("../src/db/schema.js");
const mealsService = await import("../src/modules/meals/meals.service.js");

const now = new Date();
const ids = {
  trainerUser: randomUUID(),
  otherTrainerUser: randomUUID(),
  trainer: randomUUID(),
  otherTrainer: randomUUID(),
  clientToday: randomUUID(),
  clientWeek: randomUUID(),
  clientOtherTrainer: randomUUID(),
};

const trainerUser = user(ids.trainerUser, "trainer-meals@test.local", "trainer");

await db
  .insert(users)
  .values([
    trainerUser,
    user(ids.otherTrainerUser, "other-trainer-meals@test.local", "trainer"),
  ]);
await db
  .insert(trainers)
  .values([
    trainer(ids.trainer, ids.trainerUser),
    trainer(ids.otherTrainer, ids.otherTrainerUser),
  ]);
await db
  .insert(clients)
  .values([
    client(ids.clientToday, ids.trainer, "Today Client"),
    client(ids.clientWeek, ids.trainer, "Week Client"),
    client(ids.clientOtherTrainer, ids.otherTrainer, "Other Trainer Client"),
  ]);
await db.insert(mealLogs).values([
  meal(ids.clientToday, "Breakfast", atLocalTime(10)),
  meal(ids.clientToday, "Dinner", daysAgo(2)),
  meal(ids.clientWeek, "Lunch", daysAgo(6)),
  meal(ids.clientWeek, "Evening Snack", daysAgo(8)),
  meal(ids.clientOtherTrainer, "Lunch", atLocalTime(11)),
]);

test("trainer meal duration filters use owned client meals", async () => {
  const today = await mealsService.list(trainerUser, { range: "today", type: "all" });
  assert.deepEqual(today.map((row) => row.type), ["Breakfast"]);

  const week = await mealsService.list(trainerUser, { range: "week", type: "all" });
  assert.deepEqual(
    week.map((row) => row.type).sort(),
    ["Breakfast", "Dinner", "Lunch"],
  );

  const all = await mealsService.list(trainerUser, { range: "all", type: "all" });
  assert.deepEqual(
    all.map((row) => row.type).sort(),
    ["Breakfast", "Dinner", "Evening Snack", "Lunch"],
  );
});

test("trainer meal client and type filters combine with duration", async () => {
  const rows = await mealsService.list(trainerUser, {
    clientId: ids.clientToday,
    range: "all",
    type: "Dinner",
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].clientId, ids.clientToday);
  assert.equal(rows[0].type, "Dinner");
});

test("trainer meal custom date filters include full selected days", async () => {
  const rows = await mealsService.list(trainerUser, {
    startDate: dateInput(daysAgo(6)),
    endDate: dateInput(daysAgo(2)),
    range: "custom",
    type: "all",
  });

  assert.deepEqual(rows.map((row) => row.type), ["Dinner", "Lunch"]);
});

test("trainer meal pagination returns stable pages and next page state", async () => {
  const firstPage = await mealsService.list(trainerUser, {
    range: "all",
    type: "all",
    limit: 2,
    page: 1,
  });
  const secondPage = await mealsService.list(trainerUser, {
    range: "all",
    type: "all",
    limit: 2,
    page: 2,
  });

  assert.equal(firstPage.items.length, 2);
  assert.equal(firstPage.hasMore, true);
  assert.equal(firstPage.nextPage, 2);
  assert.deepEqual(firstPage.items.map((row) => row.type), ["Breakfast", "Dinner"]);

  assert.equal(secondPage.items.length, 2);
  assert.equal(secondPage.hasMore, false);
  assert.equal(secondPage.nextPage, null);
  assert.deepEqual(secondPage.items.map((row) => row.type), ["Lunch", "Evening Snack"]);
});

function user(id, email, role) {
  return {
    id,
    name: email,
    email,
    passwordHash: "not-used",
    role,
    approvalStatus: "Approved",
    tokenVersion: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function trainer(id, userId) {
  return {
    id,
    userId,
    specialization: "Strength",
    status: "Approved",
    joinedAt: now.toISOString().slice(0, 10),
    gymLocationConfigured: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function client(id, trainerId, name) {
  return {
    id,
    trainerId,
    name,
    email: `${id}@test.local`,
    goal: "General fitness",
    status: "Active",
    joinedAt: now.toISOString().slice(0, 10),
    plan: "Monthly",
    monthlyFee: 1000,
    paymentStatus: "Paid",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function meal(clientId, type, loggedAt) {
  return {
    id: randomUUID(),
    clientId,
    type,
    imageUrl: "https://example.com/meal.jpg",
    loggedAt: loggedAt.toISOString(),
    createdAt: loggedAt.toISOString(),
    updatedAt: loggedAt.toISOString(),
  };
}

function atLocalTime(hour) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function dateInput(date) {
  return date.toISOString().slice(0, 10);
}
