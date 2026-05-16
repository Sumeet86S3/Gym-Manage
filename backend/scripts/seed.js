import "dotenv/config";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { db } from "../src/config/db.js";
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
  trainers,
  users,
  workouts,
} from "../src/db/schema.js";

const passwordHash = await bcrypt.hash("password123", 12);
const now = new Date().toISOString();

const ids = {
  adminUser: randomUUID(),
  trainerUser: randomUUID(),
  trainer: randomUUID(),
  clientUser: randomUUID(),
  client: randomUUID(),
  workout: randomUUID(),
};

await db.delete(feedback);
await db.delete(exercises);
await db.delete(workouts);
await db.delete(mealLogs);
await db.delete(attendance);
await db.delete(measurements);
await db.delete(goals);
await db.delete(payments);
await db.delete(notifications);
await db.delete(clients);
await db.delete(trainers);
await db.delete(users);

await db.insert(users).values([
  {
    id: ids.adminUser,
    name: "Avery Stone",
    email: "admin@fitsphere.com",
    passwordHash,
    role: "admin",
    approvalStatus: "Approved",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: ids.trainerUser,
    name: "Alex Rivera",
    email: "trainer@fitsphere.com",
    passwordHash,
    role: "trainer",
    approvalStatus: "Approved",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: ids.clientUser,
    name: "Olivia Bennett",
    email: "client@fitsphere.com",
    passwordHash,
    role: "client",
    approvalStatus: "Approved",
    createdAt: now,
    updatedAt: now,
  },
]);

await db.insert(trainers).values({
  id: ids.trainer,
  userId: ids.trainerUser,
  specialization: "Strength and conditioning",
  status: "Approved",
  joinedAt: "2024-08-12",
  createdAt: now,
  updatedAt: now,
});

await db.insert(clients).values([
  {
    id: ids.client,
    userId: ids.clientUser,
    trainerId: ids.trainer,
    name: "Olivia Bennett",
    email: "olivia@example.com",
    goal: "Weight loss",
    status: "Active",
    lastVisit: "Today",
    joinedAt: "2024-12-10",
    streak: 5,
    plan: "Premium Quarterly",
    paymentStatus: "Paid",
    dueDate: "2025-07-10",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    trainerId: ids.trainer,
    name: "Liam Carter",
    email: "liam@example.com",
    goal: "Muscle gain",
    status: "Active",
    lastVisit: "Yesterday",
    joinedAt: "2025-01-22",
    streak: 12,
    plan: "Standard Monthly",
    paymentStatus: "Due",
    dueDate: "2025-04-28",
    createdAt: now,
    updatedAt: now,
  },
]);

await db.insert(workouts).values({
  id: ids.workout,
  trainerId: ids.trainer,
  clientId: ids.client,
  name: "Upper Body Strength",
  type: "Strength",
  durationMinutes: 45,
  createdAt: now,
  updatedAt: now,
});

const exerciseIds = [randomUUID(), randomUUID(), randomUUID()];
await db.insert(exercises).values([
  {
    id: exerciseIds[0],
    workoutId: ids.workout,
    name: "Barbell Bench Press",
    type: "Compound",
    equipment: "Barbell",
    sets: 4,
    reps: 8,
    weight: 60,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: exerciseIds[1],
    workoutId: ids.workout,
    name: "Pull-ups",
    type: "Compound",
    equipment: "Bodyweight",
    sets: 4,
    reps: 10,
    weight: 0,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: exerciseIds[2],
    workoutId: ids.workout,
    name: "Dumbbell Shoulder Press",
    type: "Compound",
    equipment: "Dumbbells",
    sets: 3,
    reps: 12,
    weight: 18,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
]);

await db.insert(mealLogs).values({
  id: randomUUID(),
  clientId: ids.client,
  type: "Breakfast",
  note: "Oats with berries + 3 egg whites",
  imageUrl:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=70",
  loggedAt: now,
  createdAt: now,
  updatedAt: now,
});

await db.insert(measurements).values([
  {
    id: randomUUID(),
    clientId: ids.client,
    weight: 82.4,
    chest: 102,
    waist: 92,
    arms: 36,
    measuredAt: "2025-03-01T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    clientId: ids.client,
    weight: 78.0,
    chest: 104,
    waist: 87,
    arms: 37.5,
    measuredAt: "2025-04-19T00:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
]);

await db.insert(goals).values([
  {
    id: randomUUID(),
    clientId: ids.client,
    title: "Lose 8 kg",
    startValue: 86,
    currentValue: 78,
    targetValue: 78,
    unit: "kg",
    reverse: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    clientId: ids.client,
    title: "Bench press 80kg",
    startValue: 50,
    currentValue: 65,
    targetValue: 80,
    unit: "kg",
    reverse: false,
    createdAt: now,
    updatedAt: now,
  },
]);

await db.insert(payments).values({
  id: randomUUID(),
  clientId: ids.client,
  amount: 19999,
  currency: "INR",
  plan: "Premium Quarterly",
  status: "Paid",
  paidAt: "2025-04-10T00:00:00.000Z",
  createdAt: now,
  updatedAt: now,
});

await db.insert(notifications).values({
  id: randomUUID(),
  userId: ids.trainerUser,
  type: "feedback",
  title: "New feedback submitted",
  body: "Olivia reported joint pain",
  createdAt: now,
  updatedAt: now,
});

console.log("Seeded FitSphere Turso database.");
