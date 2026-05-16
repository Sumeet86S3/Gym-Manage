import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, payments } from "../../db/schema.js";
import { clientForUser } from "../clients/clients.service.js";

export async function list(user, query = {}) {
  const where = [];
  if (user.role === "client") where.push(eq(payments.clientId, (await clientForUser(user)).id));
  if (query.clientId) where.push(eq(payments.clientId, query.clientId));
  if (query.status) where.push(eq(payments.status, query.status));
  const queryBuilder = db
    .select({
      id: payments.id,
      clientId: payments.clientId,
      clientName: clients.name,
      amount: payments.amount,
      currency: payments.currency,
      plan: payments.plan,
      status: payments.status,
      paidAt: payments.paidAt,
      dueDate: payments.dueDate,
      provider: payments.provider,
      providerPaymentId: payments.providerPaymentId,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id));

  return where.length ? queryBuilder.where(and(...where)) : queryBuilder;
}

export async function create(input) {
  const now = new Date().toISOString();
  const [payment] = await db
    .insert(payments)
    .values({ id: randomUUID(), ...input, createdAt: now, updatedAt: now })
    .returning();
  await db
    .update(clients)
    .set({ paymentStatus: input.status, plan: input.plan, dueDate: input.dueDate })
    .where(eq(clients.id, input.clientId));
  return payment;
}
