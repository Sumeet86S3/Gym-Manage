import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    role: z.enum(["admin", "trainer", "client"]).optional(),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const trainerSignupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    specialization: z.string().max(120).optional(),
  }),
});
