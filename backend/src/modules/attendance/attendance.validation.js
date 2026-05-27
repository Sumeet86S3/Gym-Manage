import { z } from "zod";

const coordinateSchema = z.number({ coerce: true }).finite();

const latitudeSchema = coordinateSchema.min(-90).max(90);
const longitudeSchema = coordinateSchema.min(-180).max(180);
const accuracySchema = coordinateSchema.positive().max(10000);

export const listAttendanceSchema = z.object({
  query: z.object({
    date: z.string().optional(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    clientId: z.string().min(1).optional(),
    date: z.string().optional(),
    location: z
      .object({
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        accuracyMeters: accuracySchema,
      })
      .optional(),
  }),
});

export const updateAttendanceSettingsSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(240),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    radiusMeters: coordinateSchema.min(50).max(500),
  }),
});
