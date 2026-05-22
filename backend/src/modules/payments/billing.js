import { desc, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { clients, payments } from "../../db/schema.js";
import { randomUUID } from "node:crypto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const PAYMENT_STATUSES = ["Paid", "Due Soon", "Unpaid"];

export function normalizePaymentStatus(status) {
  if (status === "Due") return "Due Soon";
  if (status === "Overdue") return "Unpaid";
  return PAYMENT_STATUSES.includes(status) ? status : "Paid";
}

export function dateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function toDate(dateValue) {
  return new Date(`${dateOnly(dateValue)}T00:00:00.000Z`);
}

export function addMonthsFromAnchor(anchorDate, monthsToAdd) {
  const anchor = toDate(anchorDate);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth() + monthsToAdd;
  const day = anchor.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return dateOnly(new Date(Date.UTC(year, month, Math.min(day, lastDay))));
}

export function nextMonthlyDueDate(admissionDate, afterDate = new Date()) {
  const after = toDate(afterDate);
  let monthsToAdd = 1;
  let next = addMonthsFromAnchor(admissionDate, monthsToAdd);

  while (toDate(next).getTime() <= after.getTime()) {
    monthsToAdd += 1;
    next = addMonthsFromAnchor(admissionDate, monthsToAdd);
  }

  return next;
}

export function paymentStatusForDueDate(dueDate, today = new Date()) {
  if (!dueDate) return "Paid";
  const daysUntilDue = Math.ceil(
    (toDate(dueDate).getTime() - toDate(today).getTime()) / MS_PER_DAY,
  );
  if (daysUntilDue < 0) return "Unpaid";
  if (daysUntilDue <= 3) return "Due Soon";
  return "Paid";
}

export async function refreshBillingStatuses() {
  const rows = await db.select().from(clients);
  const now = new Date().toISOString();

  for (const client of rows) {
    const clientPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, client.id))
      .orderBy(desc(payments.createdAt));
    const latestPayment = clientPayments[0];
    const monthlyFee = client.monthlyFee || latestPayment?.amount || 0;
    const status = normalizePaymentStatus(paymentStatusForDueDate(client.dueDate));

    if (!latestPayment) {
      await db.insert(payments).values({
        id: randomUUID(),
        clientId: client.id,
        amount: monthlyFee,
        currency: "INR",
        plan: client.plan,
        status,
        paidAt: status === "Paid" ? `${dateOnly(client.joinedAt)}T00:00:00.000Z` : null,
        dueDate: client.dueDate,
        createdAt: now,
        updatedAt: now,
      });
    } else if (!latestPayment.dueDate && client.dueDate) {
      await db
        .update(payments)
        .set({
          amount: monthlyFee,
          plan: client.plan,
          status,
          dueDate: client.dueDate,
          updatedAt: now,
        })
        .where(eq(payments.id, latestPayment.id));
    }

    if (client.paymentStatus !== status) {
      await db
        .update(clients)
        .set({ monthlyFee, paymentStatus: status, updatedAt: now })
        .where(eq(clients.id, client.id));
    } else if (!client.monthlyFee && monthlyFee) {
      await db.update(clients).set({ monthlyFee, updatedAt: now }).where(eq(clients.id, client.id));
    }
  }

  const paymentRows = await db.select().from(payments);
  for (const payment of paymentRows) {
    const status = normalizePaymentStatus(paymentStatusForDueDate(payment.dueDate));
    if (payment.status !== status) {
      await db.update(payments).set({ status, updatedAt: now }).where(eq(payments.id, payment.id));
    }
  }
}
