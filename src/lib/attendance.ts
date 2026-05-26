import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface GymLocationSettings {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt: string;
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
  clients: Array<{ id: string; name: string; status?: string; streak?: number; [key: string]: unknown }>;
  entries: AttendanceHistoryEntry[];
  todayEntry?: AttendanceHistoryEntry | null;
}

export interface MarkAttendanceResult {
  marked: boolean;
  alreadyMarked: boolean;
  entry: AttendanceHistoryEntry;
  client: unknown;
}

export const defaultGymSettings: GymLocationSettings = {
  name: "FitSphere Elite Studio",
  address: "Indiranagar Performance Hub",
  latitude: 12.9719,
  longitude: 77.6412,
  radiusMeters: 100,
  updatedAt: "2026-05-24T08:00:00.000Z",
};

const gymSettingsKey = "fitsphere:gym-location-settings";
export const attendanceQueryKey = ["api", "/attendance"] as const;

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
    mutationFn: (input?: { clientId?: string; date?: string }) =>
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

export function normalizeAttendanceEntry(entry: AttendanceHistoryEntry): AttendanceHistoryEntry {
  return {
    ...entry,
    checkedInAt: entry.checkedInAt ?? entry.markedAt,
    status: "Marked",
    method: entry.method ?? "Trainer",
  };
}
