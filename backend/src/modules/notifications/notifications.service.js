import { eq, or, isNull } from "drizzle-orm";
import { db } from "../../config/db.js";
import { clients, notifications } from "../../db/schema.js";
import { refreshBillingStatuses } from "../payments/billing.js";

export async function list(user) {
  await refreshBillingStatuses();
  const stored = await db
    .select()
    .from(notifications)
    .where(or(eq(notifications.userId, user.id), isNull(notifications.userId)));

  if (user.role !== "client") return stored;

  const [client] = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  if (!client || client.paymentStatus === "Paid") return stored;

  return [
    {
      id: `payment-reminder-${client.id}`,
      userId: user.id,
      type: "payment",
      title: client.paymentStatus === "Unpaid" ? "Payment overdue" : "Payment due soon",
      body:
        client.paymentStatus === "Unpaid"
          ? `Your ${client.plan} fee is unpaid. Please complete the payment.`
          : `Your ${client.plan} fee is due on ${client.dueDate}.`,
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    ...stored,
  ];
}

export async function markRead(user, id) {
  const [notification] = await db
    .update(notifications)
    .set({ readAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(notifications.id, id))
    .returning();
  return notification;
}
