import { and, eq, isNull, like } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { clients, payments, trainers, users } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { deleteClientCascade } from "../../services/cascade-delete.service.js";
import { dateOnly, nextMonthlyDueDate, refreshBillingStatuses } from "../payments/billing.js";

const SALT_ROUNDS = 12;

export async function trainerForUser(user) {
  const [trainer] = await db.select().from(trainers).where(eq(trainers.userId, user.id)).limit(1);
  if (!trainer) throw new AppError("Trainer profile not found", 404);
  return trainer;
}

export async function clientForUser(user) {
  const [client] = await db.select().from(clients).where(eq(clients.userId, user.id)).limit(1);
  if (!client) throw new AppError("Client profile not found", 404);
  return client;
}

export async function list(user, query = {}) {
  await refreshBillingStatuses();
  const where = [isNull(clients.deletedAt)];
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    where.push(eq(clients.trainerId, trainer.id));
  } else if (query.trainerId) {
    where.push(eq(clients.trainerId, query.trainerId));
  }
  if (query.q) where.push(like(clients.name, `%${query.q}%`));

  return db
    .select()
    .from(clients)
    .where(and(...where));
}

export async function getById(user, id) {
  await refreshBillingStatuses();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);
  if (!client) throw new AppError("Client not found", 404);
  if (user.role === "trainer") {
    const trainer = await trainerForUser(user);
    if (client.trainerId !== trainer.id) throw new AppError("Client not found", 404);
  }
  return client;
}

export async function create(user, input) {
  const trainer = await trainerForUser(user);
  const now = new Date().toISOString();
  const email = input.email.toLowerCase();
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser.length) throw new AppError("Email is already registered", 409);

  const password = generateClientPassword(input.name);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = randomUUID();
  const clientId = randomUUID();
  const admissionDate = input.admissionDate ?? now.slice(0, 10);
  const monthlyFee = input.monthlyFee ?? 0;
  const plan = input.plan ?? "Standard Monthly";
  const dueDate = input.dueDate ?? nextMonthlyDueDate(admissionDate, admissionDate);

  await db.insert(users).values({
    id: userId,
    name: input.name,
    email,
    passwordHash,
    role: "client",
    approvalStatus: "Approved",
    createdAt: now,
    updatedAt: now,
  });

  const [client] = await db
    .insert(clients)
    .values({
      id: clientId,
      userId,
      trainerId: trainer.id,
      name: input.name,
      email,
      goal: input.goal ?? "General fitness",
      status: "Active",
      lastVisit: "Today",
      joinedAt: admissionDate,
      streak: 0,
      plan,
      monthlyFee,
      paymentStatus: input.paymentStatus ?? "Paid",
      dueDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(payments).values({
    id: randomUUID(),
    clientId,
    amount: monthlyFee,
    currency: "INR",
    plan,
    status: "Paid",
    paidAt: `${dateOnly(admissionDate)}T00:00:00.000Z`,
    dueDate,
    createdAt: now,
    updatedAt: now,
  });

  return {
    client,
    credentials: {
      email,
      password,
    },
  };
}

export async function update(user, id, input) {
  const existing = await getById(user, id);
  if (input.email) {
    const email = input.email.toLowerCase();
    const [duplicateClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, email))
      .limit(1);
    if (duplicateClient && duplicateClient.id !== id) {
      throw new AppError("Email is already registered", 409);
    }
    const [duplicateUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (duplicateUser && duplicateUser.id !== existing.userId) {
      throw new AppError("Email is already registered", 409);
    }
  }
  const { admissionDate, ...clientInput } = input;
  const update = {
    ...clientInput,
    ...(admissionDate ? { joinedAt: admissionDate } : {}),
    ...(clientInput.email ? { email: clientInput.email.toLowerCase() } : {}),
    updatedAt: new Date().toISOString(),
  };

  const [updated] = await db.update(clients).set(update).where(eq(clients.id, id)).returning();

  if (existing.userId && (input.name || input.email)) {
    await db
      .update(users)
      .set({
        ...(input.name ? { name: input.name } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, existing.userId));
  }

  return updated;
}

export async function remove(user, id) {
  await getById(user, id);
  return db.transaction((tx) => deleteClientCascade(id, tx));
}

function generateClientPassword(name) {
  const firstName = name.trim().split(/\s+/)[0] || "Client";
  const base = firstName.replace(/[^a-z0-9]/gi, "").slice(0, 12) || "Client";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${capitalize(base)}@${number}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
