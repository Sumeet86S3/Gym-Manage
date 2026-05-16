import { eq, or, isNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { notifications } from "../../db/schema.js";

export async function list(user) {
  return db
    .select()
    .from(notifications)
    .where(or(eq(notifications.userId, user.id), isNull(notifications.userId)));
}

export async function markRead(user, id) {
  const [notification] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(notifications.id, id))
    .returning();
  return notification;
}
