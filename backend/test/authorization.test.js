import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars";
process.env.TURSO_DATABASE_URL = `file:authz-test-${Date.now()}.db`;
process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
process.env.IMAGEKIT_PRIVATE_KEY = "test-private";

await import("../scripts/migrate.js");

const { db } = await import("../src/config/db.js");
const { users, trainers, clients, workouts, exercises } = await import("../src/db/schema.js");
const paymentsService = await import("../src/modules/payments/payments.service.js");
const goalsService = await import("../src/modules/goals/goals.service.js");
const workoutsService = await import("../src/modules/workouts/workouts.service.js");

const now = new Date().toISOString();
const ids = {
  trainerUserA: randomUUID(),
  trainerUserB: randomUUID(),
  trainerA: randomUUID(),
  trainerB: randomUUID(),
  clientUserA: randomUUID(),
  clientUserB: randomUUID(),
  clientA: randomUUID(),
  clientB: randomUUID(),
  workoutA: randomUUID(),
  workoutB: randomUUID(),
  exerciseA: randomUUID(),
  exerciseB: randomUUID(),
};

const trainerUserA = user(ids.trainerUserA, "trainer-a@test.local", "trainer");
const trainerUserB = user(ids.trainerUserB, "trainer-b@test.local", "trainer");
const clientUserA = user(ids.clientUserA, "client-a@test.local", "client");

await db.insert(users).values([
  trainerUserA,
  trainerUserB,
  clientUserA,
  user(ids.clientUserB, "client-b@test.local", "client"),
]);
await db.insert(trainers).values([
  trainer(ids.trainerA, ids.trainerUserA),
  trainer(ids.trainerB, ids.trainerUserB),
]);
await db.insert(clients).values([
  client(ids.clientA, ids.clientUserA, ids.trainerA, "Client A"),
  client(ids.clientB, ids.clientUserB, ids.trainerB, "Client B"),
]);
await db.insert(workouts).values([
  workout(ids.workoutA, ids.trainerA, ids.clientA),
  workout(ids.workoutB, ids.trainerB, ids.clientB),
]);
await db.insert(exercises).values([
  exercise(ids.exerciseA, ids.workoutA),
  exercise(ids.exerciseB, ids.workoutB),
]);

test("trainer cannot create a payment for another trainer's client", async () => {
  await assert.rejects(
    paymentsService.create(trainerUserA, {
      clientId: ids.clientB,
      amount: 5000,
      currency: "INR",
      plan: "Monthly",
      status: "Paid",
    }),
    (error) => error.statusCode === 403,
  );
});

test("trainer goal listing is restricted to owned clients", async () => {
  await goalsService.create(trainerUserA, goal(ids.clientA, "Goal A"));
  await goalsService.create(trainerUserB, goal(ids.clientB, "Goal B"));

  const rows = await goalsService.list(trainerUserA);
  assert.deepEqual(
    rows.map((row) => row.clientId).sort(),
    [ids.clientA],
  );
});

test("trainer cannot create or list goals for another trainer's client", async () => {
  await assert.rejects(
    goalsService.create(trainerUserA, goal(ids.clientB, "Invalid Goal")),
    (error) => error.statusCode === 403,
  );
  await assert.rejects(
    goalsService.list(trainerUserA, { clientId: ids.clientB }),
    (error) => error.statusCode === 403,
  );
});

test("trainer cannot assign workouts to another trainer's client", async () => {
  await assert.rejects(
    workoutsService.create(trainerUserA, {
      clientId: ids.clientB,
      name: "Invalid Assignment",
      type: "Strength",
      exercises: [],
    }),
    (error) => error.statusCode === 403,
  );
});

test("client feedback requires workout ownership and exercise membership", async () => {
  await assert.rejects(
    workoutsService.submitFeedback(clientUserA, ids.exerciseB, feedback(ids.workoutB)),
    (error) => error.statusCode === 403,
  );

  await assert.rejects(
    workoutsService.submitFeedback(clientUserA, ids.exerciseB, feedback(ids.workoutA)),
    (error) => error.statusCode === 403,
  );
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
    createdAt: now,
    updatedAt: now,
  };
}

function trainer(id, userId) {
  return {
    id,
    userId,
    specialization: "Strength",
    status: "Approved",
    joinedAt: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
}

function client(id, userId, trainerId, name) {
  return {
    id,
    userId,
    trainerId,
    name,
    email: `${id}@test.local`,
    goal: "General fitness",
    status: "Active",
    joinedAt: now.slice(0, 10),
    plan: "Monthly",
    monthlyFee: 1000,
    paymentStatus: "Paid",
    createdAt: now,
    updatedAt: now,
  };
}

function workout(id, trainerId, clientId) {
  return {
    id,
    trainerId,
    clientId,
    name: `Workout ${id}`,
    type: "Strength",
    durationMinutes: 45,
    createdAt: now,
    updatedAt: now,
  };
}

function exercise(id, workoutId) {
  return {
    id,
    workoutId,
    name: `Exercise ${id}`,
    type: "Strength",
    equipment: "Dumbbell",
    sets: 3,
    reps: 10,
    weight: 10,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function goal(clientId, title) {
  return {
    clientId,
    title,
    startValue: 0,
    currentValue: 1,
    targetValue: 10,
    unit: "kg",
    reverse: false,
  };
}

function feedback(workoutId) {
  return {
    workoutId,
    difficulty: "Moderate",
    energy: "Normal",
    issue: "No issue",
    notes: "ok",
  };
}
