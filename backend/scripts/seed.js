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
};

// Clear all data
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


// Create 3 users only
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

// Create trainer profile
await db.insert(trainers).values({
  id: ids.trainer,
  userId: ids.trainerUser,
  specialization: "Strength and conditioning",
  status: "Approved",
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
});

// Create client profile
await db.insert(clients).values({
  id: randomUUID(),
  userId: ids.clientUser,
  trainerId: ids.trainer,
  name: "Olivia Bennett",
  email: "client@fitsphere.com",
  goal: "General fitness",
  status: "Active",
  joinedAt: now,
  streak: 0,
  plan: "Standard Monthly",
  paymentStatus: "Paid",
  createdAt: now,
  updatedAt: now,
});

console.log("✅ Seeded FitSphere with 3 users (admin, trainer, client). All dummy data cleared.")
