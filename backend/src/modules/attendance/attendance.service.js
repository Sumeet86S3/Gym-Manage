import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../../config/db.js";
import { logger } from "../../config/logger.js";
import { attendance, clients, trainers } from "../../db/schema.js";
import { AppError } from "../../utils/AppError.js";
import { clientForUser, trainerForUser } from "../clients/clients.service.js";

const MAX_GPS_ACCURACY_METERS = 150;
const MAX_RADIUS_BUFFER_METERS = 50;
const defaultGymSettings = {
  name: "FitSphere Elite Studio",
  address: "Indiranagar Performance Hub",
  latitude: 12.9719,
  longitude: 77.6412,
  radiusMeters: 100,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function list(user, date = today()) {
  if (user.role === "client") {
    const client = await clientForUser(user);
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.id, client.trainerId))
      .limit(1);
    const entries = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.clientId, client.id), eq(attendance.date, date)));
    return {
      date,
      client,
      clients: [client],
      entries: entries.map((entry) => entryWithClient(entry, client)),
      todayEntry: entries[0] ? entryWithClient(entries[0], client) : null,
      gymSettings: trainerGymSettings(trainer),
    };
  }

  const trainer = await trainerForUser(user);
  const roster = await db.select().from(clients).where(eq(clients.trainerId, trainer.id));
  const entries = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.trainerId, trainer.id), eq(attendance.date, date)));
  return {
    date,
    clients: roster,
    entries: entries.map((entry) =>
      entryWithClient(
        entry,
        roster.find((client) => client.id === entry.clientId),
      ),
    ),
    gymSettings: trainerGymSettings(trainer),
  };
}

export async function toggle(user, { clientId, date = today(), location }) {
  const { trainerId, client } = await attendanceTarget(user, clientId);
  if (!client) throw new AppError("Client not found", 404);
  const targetClientId = client.id;
  const isClientSelfCheckIn = user.role === "client";
  const [trainer] = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
  const gymSettings = trainerGymSettings(trainer);

  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.clientId, targetClientId), eq(attendance.date, date)))
    .limit(1);

  if (existing) {
    logger.info(
      {
        area: "attendance",
        event: "duplicate_attendance",
        userId: user.id,
        clientId: targetClientId,
        trainerId,
        date,
      },
      "Duplicate attendance prevented",
    );
    return {
      marked: true,
      alreadyMarked: true,
      entry: entryWithClient(existing, client),
      client,
    };
  }

  const locationAudit = isClientSelfCheckIn
    ? validateClientLocation({ user, client, location, gymSettings })
    : null;

  const now = new Date().toISOString();
  let entry;
  try {
    [entry] = await db
      .insert(attendance)
      .values({
        id: randomUUID(),
        clientId: targetClientId,
        trainerId,
        date,
        markedAt: now,
        method: isClientSelfCheckIn ? "GPS" : "Trainer",
        latitude: locationAudit?.latitude,
        longitude: locationAudit?.longitude,
        accuracyMeters: locationAudit?.accuracyMeters,
        distanceMeters: locationAudit?.distanceMeters,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error) {
    const [raceWinner] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.clientId, targetClientId), eq(attendance.date, date)))
      .limit(1);
    if (raceWinner) {
      logger.info(
        {
          area: "attendance",
          event: "duplicate_attendance_race",
          userId: user.id,
          clientId: targetClientId,
          trainerId,
          date,
        },
        "Duplicate attendance prevented after race",
      );
      return {
        marked: true,
        alreadyMarked: true,
        entry: entryWithClient(raceWinner, client),
        client,
      };
    }
    throw error;
  }
  logger.info(
    {
      area: "attendance",
      event: "attendance_marked",
      userId: user.id,
      role: user.role,
      clientId: targetClientId,
      trainerId,
      date,
      userCoordinates: locationAudit
        ? { latitude: locationAudit.latitude, longitude: locationAudit.longitude }
        : undefined,
      gymCoordinates: { latitude: gymSettings.latitude, longitude: gymSettings.longitude },
      radiusMeters: gymSettings.radiusMeters,
      calculatedDistanceMeters: locationAudit?.distanceMeters,
      gpsAccuracyMeters: locationAudit?.accuracyMeters,
      method: isClientSelfCheckIn ? "GPS" : "Trainer",
    },
    "Attendance marked",
  );
  const [updatedClient] = await db
    .update(clients)
    .set({
      streak: client.streak + 1,
      lastVisit: date === today() ? "Today" : date,
      updatedAt: now,
    })
    .where(eq(clients.id, client.id))
    .returning();
  return {
    marked: true,
    alreadyMarked: false,
    entry: entryWithClient(entry, updatedClient),
    client: updatedClient,
  };
}

export async function updateSettings(user, input) {
  const trainer = await trainerForUser(user);
  const normalized = normalizeGymSettings(input);
  const [updated] = await db
    .update(trainers)
    .set({
      gymName: normalized.name,
      gymAddress: normalized.address,
      gymLatitude: normalized.latitude,
      gymLongitude: normalized.longitude,
      attendanceRadiusMeters: normalized.radiusMeters,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(trainers.id, trainer.id))
    .returning();

  logger.info(
    {
      area: "attendance",
      event: "attendance_settings_updated",
      userId: user.id,
      trainerId: trainer.id,
      gymCoordinates: { latitude: normalized.latitude, longitude: normalized.longitude },
      radiusMeters: normalized.radiusMeters,
    },
    "Attendance location settings updated",
  );

  return trainerGymSettings(updated);
}

async function attendanceTarget(user, requestedClientId) {
  if (user.role === "client") {
    const client = await clientForUser(user);
    if (requestedClientId && requestedClientId !== client.id) {
      throw new AppError("Client not found", 404);
    }
    if (!client.trainerId) throw new AppError("Trainer assignment not found", 404);
    return { trainerId: client.trainerId, client };
  }

  const trainer = await trainerForUser(user);
  if (!requestedClientId) throw new AppError("Client is required", 400);
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, requestedClientId), eq(clients.trainerId, trainer.id)))
    .limit(1);
  return { trainerId: trainer.id, client };
}

function entryWithClient(entry, client) {
  return {
    ...entry,
    clientName: client?.name ?? "Client",
    status: "Marked",
    method: entry.method ?? "Trainer",
  };
}

function trainerGymSettings(trainer) {
  return normalizeGymSettings({
    name: trainer?.gymName ?? defaultGymSettings.name,
    address: trainer?.gymAddress ?? defaultGymSettings.address,
    latitude: trainer?.gymLatitude ?? defaultGymSettings.latitude,
    longitude: trainer?.gymLongitude ?? defaultGymSettings.longitude,
    radiusMeters: trainer?.attendanceRadiusMeters ?? defaultGymSettings.radiusMeters,
  });
}

function normalizeGymSettings(settings) {
  const latitude = Number(settings.latitude);
  const longitude = Number(settings.longitude);
  const radiusMeters = Number(settings.radiusMeters);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError("Gym latitude must be between -90 and 90.", 400);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError("Gym longitude must be between -180 and 180.", 400);
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters < 50 || radiusMeters > 500) {
    throw new AppError("Attendance radius must be between 50 m and 500 m.", 400);
  }

  return {
    name: settings.name || defaultGymSettings.name,
    address: settings.address || defaultGymSettings.address,
    latitude,
    longitude,
    radiusMeters,
    updatedAt: new Date().toISOString(),
  };
}

function validateClientLocation({ user, client, location, gymSettings }) {
  if (!location) {
    logger.warn(
      {
        area: "attendance",
        event: "attendance_location_missing",
        userId: user.id,
        clientId: client.id,
      },
      "Client attendance rejected because no GPS coordinates were submitted",
    );
    throw new AppError("Fresh GPS location is required to mark attendance.", 400);
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const accuracyMeters = Number(location.accuracyMeters);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new AppError("Submitted GPS coordinates are invalid.", 400);
  }
  if (!Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    throw new AppError("GPS accuracy is required to mark attendance.", 400);
  }
  if (accuracyMeters > MAX_GPS_ACCURACY_METERS) {
    logger.warn(
      {
        area: "attendance",
        event: "attendance_gps_accuracy_rejected",
        userId: user.id,
        clientId: client.id,
        userCoordinates: { latitude, longitude },
        gymCoordinates: { latitude: gymSettings.latitude, longitude: gymSettings.longitude },
        gpsAccuracyMeters: Math.round(accuracyMeters),
      },
      "Client attendance rejected because GPS accuracy was insufficient",
    );
    throw new AppError(
      "Waiting for accurate GPS location. Move outdoors or enable precise location.",
      400,
    );
  }

  const distanceMeters = calculateDistanceMeters(gymSettings, { latitude, longitude });
  const allowedDistanceMeters =
    gymSettings.radiusMeters + Math.min(accuracyMeters, MAX_RADIUS_BUFFER_METERS);
  if (distanceMeters > allowedDistanceMeters) {
    logger.warn(
      {
        area: "attendance",
        event: "attendance_radius_rejected",
        userId: user.id,
        clientId: client.id,
        userCoordinates: { latitude, longitude },
        gymCoordinates: { latitude: gymSettings.latitude, longitude: gymSettings.longitude },
        calculatedDistanceMeters: distanceMeters,
        gpsAccuracyMeters: Math.round(accuracyMeters),
        radiusMeters: gymSettings.radiusMeters,
      },
      "Client attendance rejected outside allowed radius",
    );
    throw new AppError("Attendance denied. You are outside the allowed gym area.", 403);
  }

  return {
    latitude,
    longitude,
    accuracyMeters: Math.round(accuracyMeters),
    distanceMeters,
  };
}

function calculateDistanceMeters(from, to) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;

  return Math.round(
    earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
