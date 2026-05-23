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
    imageData: z
      .string()
      .regex(
        /^data:image\/(png|jpe?g|webp);base64,/i,
        "Meal image must be a PNG, JPG, or WebP data URL",
      )
      .max(14_000_000, "Meal image must be under 10MB"),
    imageFileName: z.string().max(255).optional(),
    loggedAt: z.string().datetime().optional(),
  }),
});
