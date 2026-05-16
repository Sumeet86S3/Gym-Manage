import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { goals } from "../../db/schema.js";
import { clientForUser } from "../clients/clients.service.js";

export async function list(user, query = {}) {
  let clientId = query.clientId;
  if (user.role === "client") clientId = (await clientForUser(user)).id;
  if (!clientId) return db.select().from(goals);
  return db.select().from(goals).where(eq(goals.clientId, clientId));
}

export async function create(input) {
  const now = new Date().toISOString();
  const [goal] = await db
    .insert(goals)
    .values({ id: randomUUID(), ...input, createdAt: now, updatedAt: now })
    .returning();
  return goal;
}
