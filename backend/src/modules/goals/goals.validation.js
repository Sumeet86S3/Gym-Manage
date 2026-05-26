import { z } from "zod";

export const listGoalsSchema = z.object({
  query: z.object({
    clientId: z.string().optional(),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    title: z.string().min(2).max(160),
    startValue: z.number(),
    currentValue: z.number(),
    targetValue: z.number(),
    unit: z.string().min(1).max(20),
    reverse: z.boolean().default(false),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createGoalSchema.shape.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const goalIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
