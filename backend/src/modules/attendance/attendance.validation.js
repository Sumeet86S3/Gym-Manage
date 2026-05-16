import { z } from "zod";

export const listAttendanceSchema = z.object({
  query: z.object({
    date: z.string().optional(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    clientId: z.string().min(1),
    date: z.string().optional(),
  }),
});
