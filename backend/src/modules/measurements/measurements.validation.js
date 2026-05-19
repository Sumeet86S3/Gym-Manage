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
    height: z.number().positive().optional(),
    chest: z.number().positive().optional(),
    waist: z.number().positive().optional(),
    arms: z.number().positive().optional(),
    leftBicep: z.number().positive().optional(),
    rightBicep: z.number().positive().optional(),
    leftForearm: z.number().positive().optional(),
    rightForearm: z.number().positive().optional(),
    upperBelly: z.number().positive().optional(),
    lowerBelly: z.number().positive().optional(),
    hip: z.number().positive().optional(),
    thigh: z.number().positive().optional(),
    leftThigh: z.number().positive().optional(),
    rightThigh: z.number().positive().optional(),
    calf: z.number().positive().optional(),
    leftCalf: z.number().positive().optional(),
    rightCalf: z.number().positive().optional(),
    measuredAt: z.string().datetime().optional(),
  }),
});
