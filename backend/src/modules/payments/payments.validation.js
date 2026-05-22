import { z } from "zod";

export const listPaymentsSchema = z.object({
  query: z.object({
    clientId: z.string().optional(),
    status: z.enum(["Paid", "Due Soon", "Unpaid"]).optional(),
  }),
});

export const createPaymentSchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    amount: z.number().int().positive(),
    currency: z.string().length(3).default("INR"),
    plan: z.string().min(1),
    status: z.enum(["Paid", "Due Soon", "Unpaid"]),
    paidAt: z.string().datetime().optional(),
    dueDate: z.string().optional(),
    provider: z.string().optional(),
    providerPaymentId: z.string().optional(),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
