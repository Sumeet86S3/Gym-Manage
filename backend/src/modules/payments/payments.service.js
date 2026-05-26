import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, payments } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { assertTrainerOwnsClient } from "../../services/authorization.service.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";
import {
  dateOnly,
  nextMonthlyDueDate,
  normalizePaymentStatus,
  paymentStatusForDueDate,
  refreshBillingStatuses,
} from "./billing.js";

export async function list(user, query = {}) {
  await refreshBillingStatuses();
  const where = [];
  if (user.role === "client") where.push(eq(payments.clientId, (await clientForUser(user)).id));
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    if (query.clientId) await assertTrainerOwnsClient(trainer.id, query.clientId);
    where.push(eq(clients.trainerId, trainer.id));
  }
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

  return where.length
    ? queryBuilder.where(and(...where)).orderBy(desc(payments.createdAt))
    : queryBuilder.orderBy(desc(payments.createdAt));
}

export async function create(user, input) {
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    await assertTrainerOwnsClient(trainer.id, input.clientId);
  }

  const now = new Date().toISOString();
  const status = normalizePaymentStatus(input.status);
  const [payment] = await db
    .insert(payments)
    .values({ id: randomUUID(), ...input, status, createdAt: now, updatedAt: now })
    .returning();
  await db
    .update(clients)
    .set({
      paymentStatus: status,
      plan: input.plan,
      dueDate: input.dueDate,
      monthlyFee: input.amount,
    })
    .where(eq(clients.id, input.clientId));
  return payment;
}

export async function markPaid(user, id) {
  await refreshBillingStatuses();
  const [row] = await db
    .select({
      payment: payments,
      client: clients,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .where(eq(payments.id, id))
    .limit(1);

  if (!row) throw new AppError("Payment not found", 404);
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    await assertTrainerOwnsClient(trainer.id, row.client.id);
  }

  const now = new Date();
  const paidAt = now.toISOString();
  const advanceFrom =
    row.payment.dueDate && new Date(row.payment.dueDate) > now
      ? row.payment.dueDate
      : dateOnly(now);
  const dueDate = nextMonthlyDueDate(row.client.joinedAt ?? dateOnly(now), advanceFrom);

  const [updated] = await db
    .update(payments)
    .set({ status: "Paid", paidAt, dueDate, updatedAt: paidAt })
    .where(eq(payments.id, id))
    .returning();

  await db
    .update(clients)
    .set({
      paymentStatus: paymentStatusForDueDate(dueDate, now),
      dueDate,
      monthlyFee: row.payment.amount,
      plan: row.payment.plan,
      updatedAt: paidAt,
    })
    .where(eq(clients.id, row.client.id));

  return updated;
}
