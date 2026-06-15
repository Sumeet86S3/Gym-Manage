import { z } from "zod";

const mealTypes = [
  "Warm water",
  "Breakfast",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Pre-Workout",
  "Post-Workout",
];

export const listMealsSchema = z.object({
  query: z.object({
    type: z.enum([...mealTypes, "all"]).optional(),
    range: z.enum(["today", "week", "date", "all"]).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    search: z.string().optional(),
    clientId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(40).optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
});

export const createMealSchema = z.object({
  body: z.object({
    type: z.enum(mealTypes),
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

export const clearMealsSchema = z.object({
  body: z.object({
    clientId: z.string().uuid(),
  }),
});
