import { z } from "zod";

const weight = z.number().positive().max(350).optional();
const height = z.number().positive().max(260).optional();
const bodyPart = z.number().positive().max(250).optional();
const optionalText = (max) => z.string().max(max).nullable().optional();
const optionalUrl = z.string().url().max(1000).or(z.literal("")).nullable().optional();
const measurementFields = {
  weight,
  height,
  chest: bodyPart,
  waist: bodyPart,
  arms: bodyPart,
  leftBicep: bodyPart,
  rightBicep: bodyPart,
  leftForearm: bodyPart,
  rightForearm: bodyPart,
  upperBelly: bodyPart,
  lowerBelly: bodyPart,
  hip: bodyPart,
  thigh: bodyPart,
  leftThigh: bodyPart,
  rightThigh: bodyPart,
  calf: bodyPart,
  leftCalf: bodyPart,
  rightCalf: bodyPart,
  trainerNote: optionalText(1000),
  condition: optionalText(80),
  frontPhotoUrl: optionalUrl,
  sidePhotoUrl: optionalUrl,
  backPhotoUrl: optionalUrl,
  measuredAt: z.string().datetime().optional(),
};

export const listMeasurementsSchema = z.object({
  query: z.object({
    clientId: z.string().optional(),
  }),
});

export const createMeasurementSchema = z.object({
  body: z.object({
    clientId: z.string().optional(),
    ...measurementFields,
  }),
});

export const updateMeasurementSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object(measurementFields).partial(),
});

export const deleteMeasurementSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
