import "dotenv/config";
import bcrypt from "bcrypt";
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
  refreshSessions,
  trainers,
  users,
  workouts,
} from "../src/db/schema.js";

const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Gym Admin",
  email: "gymadmin@local.com",
  password: "codsum8623",
};

const now = new Date().toISOString();
const passwordHash = await bcrypt.hash(admin.password, 12);

await db.delete(feedback);
await db.delete(exercises);
await db.delete(workouts);
await db.delete(mealLogs);
await db.delete(attendance);
await db.delete(measurements);
await db.delete(goals);
await db.delete(payments);
await db.delete(notifications);
await db.delete(refreshSessions);
await db.delete(clients);
await db.delete(trainers);
await db.delete(users);

await db.insert(users).values({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  passwordHash,
  role: "admin",
  approvalStatus: "Approved",
  createdAt: now,
  updatedAt: now,
});

console.log("Seeded one admin account and cleared all demo data.");
