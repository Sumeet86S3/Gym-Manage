import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq } from "drizzle-orm";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars";
process.env.TURSO_DATABASE_URL = `file:authz-test-${Date.now()}.db`;
process.env.IMAGEKIT_PUBLIC_KEY = "test-public";
process.env.IMAGEKIT_PRIVATE_KEY = "test-private";

await import("../scripts/migrate.js");

const { db } = await import("../src/config/db.js");
const {
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
} = await import("../src/db/schema.js");
const paymentsService = await import("../src/modules/payments/payments.service.js");
const goalsService = await import("../src/modules/goals/goals.service.js");
const clientsService = await import("../src/modules/clients/clients.service.js");
const trainersService = await import("../src/modules/trainers/trainers.service.js");
const workoutsService = await import("../src/modules/workouts/workouts.service.js");
const attendanceService = await import("../src/modules/attendance/attendance.service.js");
const measurementsService = await import("../src/modules/measurements/measurements.service.js");
const measurementsValidation = await import("../src/modules/measurements/measurements.validation.js");

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

await db
  .insert(users)
  .values([
    trainerUserA,
    trainerUserB,
    clientUserA,
    user(ids.clientUserB, "client-b@test.local", "client"),
  ]);
await db
  .insert(trainers)
  .values([trainer(ids.trainerA, ids.trainerUserA), trainer(ids.trainerB, ids.trainerUserB)]);
await db
  .insert(clients)
  .values([
    client(ids.clientA, ids.clientUserA, ids.trainerA, "Client A"),
    client(ids.clientB, ids.clientUserB, ids.trainerB, "Client B"),
  ]);
await db
  .insert(workouts)
  .values([
    workout(ids.workoutA, ids.trainerA, ids.clientA),
    workout(ids.workoutB, ids.trainerB, ids.clientB),
  ]);
await db
  .insert(exercises)
  .values([exercise(ids.exerciseA, ids.workoutA), exercise(ids.exerciseB, ids.workoutB)]);

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
  assert.deepEqual(rows.map((row) => row.clientId).sort(), [ids.clientA]);
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
    workoutsService.submitFeedback(clientUserA, ids.exerciseB, feedbackInput(ids.workoutB)),
    (error) => error.statusCode === 403,
  );

  await assert.rejects(
    workoutsService.submitFeedback(clientUserA, ids.exerciseB, feedbackInput(ids.workoutA)),
    (error) => error.statusCode === 403,
  );
});

test("attendance is mark-once across trainer and client views", async () => {
  const date = "2026-05-26";
  const first = await attendanceService.toggle(trainerUserA, { clientId: ids.clientA, date });
  const second = await attendanceService.toggle(clientUserA, { date });
  const trainerView = await attendanceService.list(trainerUserA, date);
  const clientView = await attendanceService.list(clientUserA, date);

  assert.equal(first.marked, true);
  assert.equal(first.alreadyMarked, false);
  assert.equal(second.marked, true);
  assert.equal(second.alreadyMarked, true);
  assert.equal(second.entry.id, first.entry.id);
  assert.equal(trainerView.entries.length, 1);
  assert.equal(clientView.entries.length, 1);
  assert.equal(clientView.todayEntry.id, first.entry.id);
  assert.equal(await countRows(attendance, attendance.clientId, ids.clientA), 1);
});

test("client attendance requires accurate GPS inside the trainer gym radius", async () => {
  const date = "2026-05-27";
  const result = await attendanceService.toggle(clientUserA, {
    date,
    location: {
      latitude: 12.9719,
      longitude: 77.6412,
      accuracyMeters: 20,
    },
  });

  assert.equal(result.marked, true);
  assert.equal(result.alreadyMarked, false);
  assert.equal(result.entry.method, "GPS");
  assert.equal(Math.round(result.entry.distanceMeters), 0);
});

test("client self attendance waits for trainer gym setup but trainer marks still sync", async () => {
  const trainerUserId = randomUUID();
  const trainerId = randomUUID();
  const clientUserId = randomUUID();
  const clientId = randomUUID();
  const trainerUser = user(trainerUserId, "trainer-pending-location@test.local", "trainer");
  const clientUser = user(clientUserId, "client-pending-location@test.local", "client");
  await db.insert(users).values([trainerUser, clientUser]);
  await db.insert(trainers).values(trainer(trainerId, trainerUserId, false));
  await db
    .insert(clients)
    .values(client(clientId, clientUserId, trainerId, "Pending Location Client"));

  const clientViewBefore = await attendanceService.list(clientUser, "2026-05-30");
  assert.equal(clientViewBefore.gymSettings.isConfigured, false);

  await assert.rejects(
    attendanceService.toggle(clientUser, {
      date: "2026-05-30",
      location: {
        latitude: 12.9719,
        longitude: 77.6412,
        accuracyMeters: 20,
      },
    }),
    (error) => error.statusCode === 409,
  );

  const trainerMark = await attendanceService.toggle(trainerUser, {
    clientId,
    date: "2026-05-30",
  });
  const clientViewAfter = await attendanceService.list(clientUser, "2026-05-30");

  assert.equal(trainerMark.marked, true);
  assert.equal(trainerMark.entry.method, "Trainer");
  assert.equal(clientViewAfter.todayEntry.id, trainerMark.entry.id);
  assert.equal(clientViewAfter.entries.length, 1);
});

test("client attendance rejects poor GPS accuracy and outside-radius locations", async () => {
  await assert.rejects(
    attendanceService.toggle(clientUserA, {
      date: "2026-05-28",
      location: {
        latitude: 12.9719,
        longitude: 77.6412,
        accuracyMeters: 400,
      },
    }),
    (error) => error.statusCode === 400,
  );

  await assert.rejects(
    attendanceService.toggle(clientUserA, {
      date: "2026-05-29",
      location: {
        latitude: 12.9819,
        longitude: 77.6512,
        accuracyMeters: 20,
      },
    }),
    (error) => error.statusCode === 403,
  );
});

test("trainer attendance settings are validated and exposed to trainer and client views", async () => {
  const settings = await attendanceService.updateSettings(trainerUserA, {
    name: "Test Gym",
    address: "Test Address",
    latitude: 13.1,
    longitude: 77.7,
    radiusMeters: 180,
  });
  const trainerView = await attendanceService.list(trainerUserA, "2026-05-30");
  const clientView = await attendanceService.list(clientUserA, "2026-05-30");

  assert.equal(settings.name, "Test Gym");
  assert.equal(settings.isConfigured, true);
  assert.equal(trainerView.gymSettings.radiusMeters, 180);
  assert.equal(trainerView.gymSettings.isConfigured, true);
  assert.equal(clientView.gymSettings.latitude, 13.1);
  await assert.rejects(
    attendanceService.updateSettings(trainerUserA, {
      name: "Bad Gym",
      address: "Bad Address",
      latitude: 120,
      longitude: 77.7,
      radiusMeters: 180,
    }),
    (error) => error.statusCode === 400,
  );
});

test("trainer measurement create updates an existing client/date entry", async () => {
  const measuredAt = "2026-06-10T12:00:00.000Z";
  const first = await measurementsService.create(trainerUserA, {
    clientId: ids.clientA,
    weight: 82,
    waist: 92,
    trainerNote: "Initial check-in",
    measuredAt,
  });
  const second = await measurementsService.create(trainerUserA, {
    clientId: ids.clientA,
    weight: 80.5,
    waist: 90,
    condition: "Morning, fasted",
    measuredAt: "2026-06-10T16:00:00.000Z",
  });

  assert.equal(second.id, first.id);
  assert.equal(second.weight, 80.5);
  assert.equal(second.waist, 90);
  assert.equal(second.condition, "Morning, fasted");
  assert.equal(await countRows(measurements, measurements.clientId, ids.clientA), 1);
});

test("trainer can patch and delete owned measurements only", async () => {
  const owned = await measurementsService.create(trainerUserA, {
    clientId: ids.clientA,
    weight: 79,
    measuredAt: "2026-06-11T12:00:00.000Z",
  });
  const other = await measurementsService.create(trainerUserB, {
    clientId: ids.clientB,
    weight: 88,
    measuredAt: "2026-06-11T12:00:00.000Z",
  });

  const updated = await measurementsService.update(trainerUserA, owned.id, {
    weight: 78.2,
    frontPhotoUrl: "https://example.com/front.jpg",
  });
  assert.equal(updated.weight, 78.2);
  assert.equal(updated.frontPhotoUrl, "https://example.com/front.jpg");

  await assert.rejects(
    measurementsService.update(trainerUserA, other.id, { weight: 87 }),
    (error) => error.statusCode === 404,
  );
  await assert.rejects(
    measurementsService.remove(trainerUserA, other.id),
    (error) => error.statusCode === 404,
  );

  await measurementsService.remove(trainerUserA, owned.id);
  assert.equal(await countRows(measurements, measurements.id, owned.id), 0);
  assert.equal(await countRows(measurements, measurements.id, other.id), 1);
});

test("measurement validation rejects unrealistic typo ranges", () => {
  const result = measurementsValidation.createMeasurementSchema.safeParse({
    body: {
      clientId: ids.clientA,
      weight: 351,
      waist: 800,
      height: 261,
      measuredAt: "2026-06-12T12:00:00.000Z",
    },
  });

  assert.equal(result.success, false);
  const errors = result.error.format();
  assert.ok(errors.body?.weight?._errors.length);
  assert.ok(errors.body?.waist?._errors.length);
  assert.ok(errors.body?.height?._errors.length);
});

test("trainer cannot delete another trainer's client", async () => {
  await assert.rejects(
    clientsService.remove(trainerUserA, ids.clientB),
    (error) => error.statusCode === 404,
  );
});

test("trainer deleting owned client cascades all dependent records", async () => {
  const fixture = await createCascadeFixture("client-delete", ids.trainerA, ids.trainerUserA);

  await clientsService.remove(trainerUserA, fixture.clientId);

  await assertNoClientRows(fixture.clientId, fixture.clientUserId, fixture.workoutId);
  assert.equal(await countRows(users, users.id, fixture.clientUserId), 0);
  assert.equal(await countRows(trainers, trainers.id, ids.trainerA), 1);
});

test("admin deleting trainer cascades trainer clients and dependent records", async () => {
  const trainerUserId = randomUUID();
  const trainerId = randomUUID();
  await db.insert(users).values(user(trainerUserId, "delete-trainer@test.local", "trainer"));
  await db.insert(trainers).values(trainer(trainerId, trainerUserId));
  const fixtureA = await createCascadeFixture("trainer-delete-a", trainerId, trainerUserId);
  const fixtureB = await createCascadeFixture("trainer-delete-b", trainerId, trainerUserId);

  await trainersService.remove(trainerId);

  await assertNoClientRows(fixtureA.clientId, fixtureA.clientUserId, fixtureA.workoutId);
  await assertNoClientRows(fixtureB.clientId, fixtureB.clientUserId, fixtureB.workoutId);
  assert.equal(await countRows(users, users.id, trainerUserId), 0);
  assert.equal(await countRows(trainers, trainers.id, trainerId), 0);
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

function trainer(id, userId, gymLocationConfigured = true) {
  return {
    id,
    userId,
    specialization: "Strength",
    status: "Approved",
    joinedAt: now.slice(0, 10),
    gymLocationConfigured,
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

function feedbackInput(workoutId) {
  return {
    workoutId,
    difficulty: "Moderate",
    energy: "Normal",
    issue: "No issue",
    notes: "ok",
  };
}

async function createCascadeFixture(label, trainerId, trainerUserId) {
  const clientUserId = randomUUID();
  const clientId = randomUUID();
  const workoutId = randomUUID();
  const exerciseId = randomUUID();
  await db.insert(users).values(user(clientUserId, `${label}-client@test.local`, "client"));
  await db.insert(clients).values(client(clientId, clientUserId, trainerId, `${label} Client`));
  await db.insert(workouts).values(workout(workoutId, trainerId, clientId));
  await db.insert(exercises).values(exercise(exerciseId, workoutId));
  await db.insert(feedback).values({
    id: randomUUID(),
    clientId,
    workoutId,
    exerciseId,
    difficulty: "Moderate",
    energy: "Normal",
    issue: "No issue",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(goals).values({
    id: randomUUID(),
    ...goal(clientId, `${label} Goal`),
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(payments).values({
    id: randomUUID(),
    clientId,
    amount: 1000,
    currency: "INR",
    plan: "Monthly",
    status: "Paid",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(measurements).values({
    id: randomUUID(),
    clientId,
    weight: 70,
    measuredAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(mealLogs).values({
    id: randomUUID(),
    clientId,
    type: "Lunch",
    imageUrl: "https://example.com/meal.jpg",
    loggedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(attendance).values({
    id: randomUUID(),
    clientId,
    trainerId,
    date: now.slice(0, 10),
    markedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .insert(refreshSessions)
    .values([refreshSession(clientUserId), refreshSession(trainerUserId)]);
  await db.insert(notifications).values({
    id: randomUUID(),
    userId: clientUserId,
    type: "test",
    title: "Test",
    body: "Test",
    createdAt: now,
    updatedAt: now,
  });

  return { clientId, clientUserId, workoutId };
}

async function assertNoClientRows(clientId, clientUserId, workoutId) {
  assert.equal(await countRows(clients, clients.id, clientId), 0);
  assert.equal(await countRows(workouts, workouts.id, workoutId), 0);
  assert.equal(await countRows(exercises, exercises.workoutId, workoutId), 0);
  assert.equal(await countRows(feedback, feedback.clientId, clientId), 0);
  assert.equal(await countRows(goals, goals.clientId, clientId), 0);
  assert.equal(await countRows(payments, payments.clientId, clientId), 0);
  assert.equal(await countRows(measurements, measurements.clientId, clientId), 0);
  assert.equal(await countRows(mealLogs, mealLogs.clientId, clientId), 0);
  assert.equal(await countRows(attendance, attendance.clientId, clientId), 0);
  assert.equal(await countRows(refreshSessions, refreshSessions.userId, clientUserId), 0);
  assert.equal(await countRows(notifications, notifications.userId, clientUserId), 0);
}

async function countRows(table, column, value) {
  const rows = await db.select().from(table).where(eq(column, value));
  return rows.length;
}

function refreshSession(userId) {
  return {
    id: randomUUID(),
    userId,
    tokenId: randomUUID(),
    tokenHash: randomUUID(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}
