import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface GymLocationSettings {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt: string;
  isConfigured: boolean;
}

export interface AttendanceHistoryEntry {
  id: string;
  clientId: string;
  clientName: string;
  trainerId?: string | null;
  date: string;
  markedAt: string;
  checkedInAt?: string;
  status: "Marked";
  method?: "GPS" | "Trainer";
}

export interface AttendanceResource {
  date: string;
  client?: unknown;
  clients: Array<{
    id: string;
    name: string;
    status?: string;
    streak?: number;
    [key: string]: unknown;
  }>;
  entries: AttendanceHistoryEntry[];
  todayEntry?: AttendanceHistoryEntry | null;
  gymSettings?: GymLocationSettings;
}

export interface MarkAttendanceResult {
  marked: boolean;
  alreadyMarked: boolean;
  entry: AttendanceHistoryEntry;
  client: unknown;
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export const defaultGymSettings: GymLocationSettings = {
  name: "FitSphere Elite Studio",
  address: "Indiranagar Performance Hub",
  latitude: 12.9719,
  longitude: 77.6412,
  radiusMeters: 100,
  updatedAt: "2026-05-24T08:00:00.000Z",
  isConfigured: false,
};

const gymSettingsKey = "fitsphere:gym-location-settings";
export const attendanceQueryKey = ["api", "/attendance"] as const;
export const attendanceGpsAccuracyLimitMeters = 150;
export const attendanceGeolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 5000,
};

export function calculateDistanceMeters(
  from: Pick<GymLocationSettings, "latitude" | "longitude">,
  to: Pick<GymLocationSettings, "latitude" | "longitude">,
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
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

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function readGymSettings() {
  if (typeof window === "undefined") return defaultGymSettings;

  try {
    const stored = window.localStorage.getItem(gymSettingsKey);
    return stored ? (JSON.parse(stored) as GymLocationSettings) : defaultGymSettings;
  } catch {
    return defaultGymSettings;
  }
}

export function saveGymSettings(settings: GymLocationSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(gymSettingsKey, JSON.stringify(settings));
}

export function normalizeGymSettings(settings?: Partial<GymLocationSettings> | null) {
  if (!settings) return defaultGymSettings;
  return {
    ...defaultGymSettings,
    ...settings,
    latitude: Number(settings.latitude ?? defaultGymSettings.latitude),
    longitude: Number(settings.longitude ?? defaultGymSettings.longitude),
    radiusMeters: Number(settings.radiusMeters ?? defaultGymSettings.radiusMeters),
    isConfigured: Boolean(settings.isConfigured),
  };
}

export function isValidGymSettings(settings: GymLocationSettings) {
  return (
    Number.isFinite(settings.latitude) &&
    settings.latitude >= -90 &&
    settings.latitude <= 90 &&
    Number.isFinite(settings.longitude) &&
    settings.longitude >= -180 &&
    settings.longitude <= 180 &&
    Number.isFinite(settings.radiusMeters) &&
    settings.radiusMeters >= 50 &&
    settings.radiusMeters <= 500
  );
}

export function getFreshAttendanceLocation(): Promise<AttendanceLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is not available on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      attendanceGeolocationOptions,
    );
  });
}

export function getGeolocationErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = Number((error as { code: unknown }).code);
    if (code === 1) {
      return "GPS permission denied. Enable location access for this site or PWA.";
    }
    if (code === 3) {
      return "Waiting for accurate GPS location. Move outdoors or try again.";
    }
  }
  return "Location permission was denied or unavailable.";
}

export function useAttendance() {
  return useQuery({
    queryKey: attendanceQueryKey,
    queryFn: ({ signal }) => api<AttendanceResource>("/attendance", { signal }),
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: { clientId?: string; date?: string; location?: AttendanceLocation }) =>
      api<MarkAttendanceResult>("/attendance", {
        method: "POST",
        body: JSON.stringify(input ?? {}),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["api", "/clients"] }),
      ]);
    },
  });
}

export function useUpdateAttendanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GymLocationSettings) =>
      api<GymLocationSettings>("/attendance/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async (settings) => {
      saveGymSettings(settings);
      await queryClient.invalidateQueries({ queryKey: attendanceQueryKey });
    },
  });
}

export function normalizeAttendanceEntry(entry: AttendanceHistoryEntry): AttendanceHistoryEntry {
  return {
    ...entry,
    checkedInAt: entry.checkedInAt ?? entry.markedAt,
    status: "Marked",
    method: entry.method ?? "Trainer",
  };
}
