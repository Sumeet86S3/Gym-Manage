import { z } from "zod";

const exerciseSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(80),
  equipment: z.string().min(1).max(80),
  sets: z.number().int().positive().default(1),
  reps: z.number().int().positive().default(1),
  weight: z.number().nonnegative().default(0),
});

export const createWorkoutSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    name: z.string().min(2).max(120),
    type: z.string().min(2).max(80),
    durationMinutes: z.number().int().positive().optional(),
    exercises: z.array(exerciseSchema).default([]),
  }),
});

export const workoutFeedbackSchema = z.object({
  params: z.object({ exerciseId: z.string().min(1) }),
  body: z.object({
    workoutId: z.string().min(1),
    difficulty: z.enum(["Easy", "Moderate", "Hard"]),
    energy: z.enum(["Low", "Normal", "High"]),
    issue: z.enum(["No issue", "Joint pain", "Muscle soreness", "Other"]),
    notes: z.string().max(1000).optional(),
  }),
});
