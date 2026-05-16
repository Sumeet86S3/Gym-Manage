import { z } from "zod";

export const listMealsSchema = z.object({
  query: z.object({
    type: z.enum(["Breakfast", "Lunch", "Dinner", "Snacks", "all"]).optional(),
    range: z.enum(["today", "week", "all"]).optional(),
    search: z.string().optional(),
  }),
});

export const createMealSchema = z.object({
  body: z.object({
    type: z.enum(["Breakfast", "Lunch", "Dinner", "Snacks"]),
    note: z.string().max(1000).optional(),
    imageUrl: z.string().min(1),
    loggedAt: z.string().datetime().optional(),
  }),
});
