import { z } from "zod";

export const listClientsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    trainerId: z.string().optional(),
  }),
});

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    goal: z.string().max(160).optional(),
    plan: z.string().max(80).optional(),
    paymentStatus: z.enum(["Paid", "Due", "Overdue"]).optional(),
    dueDate: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createClientSchema.shape.body.partial().extend({
    status: z.enum(["Active", "Inactive"]).optional(),
    lastVisit: z.string().optional(),
  }),
});

export const clientIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
