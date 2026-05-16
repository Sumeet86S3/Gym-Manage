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
    measuredAt: z.string().datetime().optional(),
  }),
});
