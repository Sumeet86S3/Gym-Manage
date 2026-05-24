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
  status: "Verified" | "Denied" | "Manual";
  distanceMeters: number;
  checkedInAt: string;
  method: "GPS" | "Trainer";
}

export const defaultGymSettings: GymLocationSettings = {
  name: "FitSphere Elite Studio",
  address: "Indiranagar Performance Hub",
  latitude: 12.9719,
  longitude: 77.6412,
  radiusMeters: 100,
  updatedAt: "2026-05-24T08:00:00.000Z",
};

export const mockAttendanceHistory: AttendanceHistoryEntry[] = [
  {
    id: "att-1001",
    clientId: "client-1",
    clientName: "Aarav Mehta",
    status: "Verified",
    distanceMeters: 42,
    checkedInAt: "2026-05-24T06:32:00.000Z",
    method: "GPS",
  },
  {
    id: "att-1002",
    clientId: "client-2",
    clientName: "Priya Nair",
    status: "Verified",
    distanceMeters: 76,
    checkedInAt: "2026-05-24T07:05:00.000Z",
    method: "GPS",
  },
  {
    id: "att-1003",
    clientId: "client-3",
    clientName: "Kabir Shah",
    status: "Denied",
    distanceMeters: 438,
    checkedInAt: "2026-05-23T18:12:00.000Z",
    method: "GPS",
  },
  {
    id: "att-1004",
    clientId: "client-4",
    clientName: "Meera Iyer",
    status: "Manual",
    distanceMeters: 0,
    checkedInAt: "2026-05-23T06:48:00.000Z",
    method: "Trainer",
  },
];

const gymSettingsKey = "fitsphere:gym-location-settings";
const attendanceHistoryKey = "fitsphere:attendance-history";

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

export function readAttendanceHistory() {
  if (typeof window === "undefined") return mockAttendanceHistory;

  try {
    const stored = window.localStorage.getItem(attendanceHistoryKey);
    return stored ? (JSON.parse(stored) as AttendanceHistoryEntry[]) : mockAttendanceHistory;
  } catch {
    return mockAttendanceHistory;
  }
}

export function saveAttendanceHistory(entries: AttendanceHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(attendanceHistoryKey, JSON.stringify(entries));
}
