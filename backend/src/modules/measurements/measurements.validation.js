import { z } from "zod";

export const listMeasurementsSchema = z.object({
  query: z.object({
    clientId: z.string().optional(),
  }),
});

export const createMeasurementSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    weight: z.number().positive().optional(),
    chest: z.number().positive().optional(),
    waist: z.number().positive().optional(),
    arms: z.number().positive().optional(),
    upperBelly: z.number().positive().optional(),
    lowerBelly: z.number().positive().optional(),
    hip: z.number().positive().optional(),
    thigh: z.number().positive().optional(),
    calf: z.number().positive().optional(),
    measuredAt: z.string().datetime().optional(),
  }),
});
