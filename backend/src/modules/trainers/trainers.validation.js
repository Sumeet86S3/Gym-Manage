import { z } from "zod";

export const trainerStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(["Pending", "Approved", "Rejected"]),
  }),
});

export const listTrainersSchema = z.object({
  query: z.object({
    status: z.enum(["Pending", "Approved", "Rejected", "All"]).optional(),
  }),
});

export const trainerIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
