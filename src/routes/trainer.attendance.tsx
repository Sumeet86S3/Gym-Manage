import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  CalendarCheck,
  Check,
  Clock3,
  Crosshair,
  LocateFixed,
  MapPin,
  Navigation,
  Radar,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/live-data";
import {
  calculateDistanceMeters,
  defaultGymSettings,
  formatDistance,
  getFreshAttendanceLocation,
  getGeolocationErrorMessage,
  isValidGymSettings,
  normalizeGymSettings,
  readGymSettings,
  saveGymSettings,
  normalizeAttendanceEntry,
  useAttendance,
  useMarkAttendance,
  useUpdateAttendanceSettings,
  type AttendanceHistoryEntry,
  type GymLocationSettings,
} from "@/lib/attendance";

export const Route = createFileRoute("/trainer/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const attendance = useAttendance();
  const markAttendanceMutation = useMarkAttendance();
  const updateAttendanceSettingsMutation = useUpdateAttendanceSettings();
  const data = (attendance.data ?? { clients: [], entries: [] }) as {
    clients: Client[];
    entries: AttendanceHistoryEntry[];
  };
  const [gymSettings, setGymSettings] = useState<GymLocationSettings>(defaultGymSettings);
  const [trainerLocation, setTrainerLocation] = useState<{ latitude: number; longitude: number }>();

  useEffect(() => {
    setGymSettings(readGymSettings());
  }, []);

  useEffect(() => {
    if (attendance.data?.gymSettings) {
      const next = normalizeGymSettings(attendance.data.gymSettings);
      setGymSettings(next);
      saveGymSettings(next);
    }
  }, [attendance.data?.gymSettings]);

  const entries = data.entries.map(normalizeAttendanceEntry);
  const todayEntries = entries.filter((entry) => isToday(entry.markedAt));
  const verifiedToday = todayEntries.length;
  const trainerDistance = useMemo(() => {
    if (!trainerLocation) return undefined;
    return calculateDistanceMeters(gymSettings, trainerLocation);
  }, [gymSettings, trainerLocation]);

  const updateSettings = (patch: Partial<GymLocationSettings>) => {
    setGymSettings((settings) => ({ ...settings, ...patch }));
  };

  const saveSettings = () => {
    if (!isValidGymSettings(gymSettings)) {
      toast.error("Enter valid coordinates and a radius between 50 m and 500 m.");
      return;
    }
    const next = { ...gymSettings, updatedAt: new Date().toISOString() };
    updateAttendanceSettingsMutation.mutate(next, {
      onSuccess: (settings) => {
        setGymSettings(settings);
        toast.success("Gym location settings saved for all clients.");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Unable to save gym settings.");
      },
    });
  };

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Location access is not available on this device.");
      return;
    }

    try {
      const location = await getFreshAttendanceLocation();
      const coordinates = {
        latitude: Number(location.latitude.toFixed(6)),
        longitude: Number(location.longitude.toFixed(6)),
        accuracyMeters: Math.round(location.accuracyMeters),
      };
      setTrainerLocation(coordinates);
      setGymSettings((settings) => ({ ...settings, ...coordinates }));
      toast.success(
        location.accuracyMeters > 150
          ? "Location applied, but GPS accuracy is weak. Move outdoors before saving."
          : "Current location applied to gym settings.",
      );
    } catch (error) {
      toast.error(getGeolocationErrorMessage(error));
    }
  };

  const markManualAttendance = (client: Client) => {
    const isMarked = data.entries.some((entry) => entry.clientId === client.id);
    if (isMarked) return;

    markAttendanceMutation.mutate(
      { clientId: client.id },
      {
        onSuccess: (result) => {
          toast.success(
            result.alreadyMarked
              ? "Today attendance has been marked."
              : "Manual attendance marked.",
          );
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Unable to mark attendance.");
        },
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Set your gym perimeter, verify location check-ins, and review attendance history."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Marked today" value={verifiedToday} icon={ShieldCheck} tone="success" />
        <StatCard
          label="Pending today"
          value={data.clients.length - verifiedToday}
          icon={Radar}
          tone="warning"
        />
        <StatCard
          label="Allowed radius"
          value={formatDistance(gymSettings.radiusMeters)}
          icon={LocateFixed}
          tone="info"
        />
        <StatCard
          label="Active clients"
          value={data.clients.filter((client) => client.status === "Active").length}
          icon={CalendarCheck}
          tone="primary"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Gym Location Settings
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Trainer-defined attendance zone
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This location and radius applies to every client assigned to you.
                </p>
                {!gymSettings.isConfigured && (
                  <p className="mt-2 max-w-2xl text-sm text-warning">
                    Clients cannot self-mark attendance until you save this gym location. You can
                    still mark attendance for them from the roster.
                  </p>
                )}
              </div>
              <Button
                onClick={saveSettings}
                disabled={updateAttendanceSettingsMutation.isPending}
                className="shrink-0"
              >
                <Save className="h-4 w-4" />
                {updateAttendanceSettingsMutation.isPending
                  ? "Saving"
                  : gymSettings.isConfigured
                    ? "Save settings"
                    : "Set gym location"}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold">Gym Location</span>
                  <input
                    value={gymSettings.name}
                    onChange={(event) => updateSettings({ name: event.target.value })}
                    placeholder="Search or enter gym address"
                    className="w-full rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-input/70 transition focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-muted-foreground">Internal Label</span>
                  <input
                    value={gymSettings.address}
                    onChange={(event) => updateSettings({ address: event.target.value })}
                    placeholder="Shown only to you"
                    className="w-full rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-input/70 transition focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </label>
              </div>

              <Button type="button" onClick={useCurrentLocation} variant="outline">
                <Crosshair className="h-4 w-4" />
                Use current location
              </Button>

              <div className="rounded-xl bg-background p-4 ring-1 ring-border/70">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Attendance Radius</p>
                    <p className="text-xs text-muted-foreground/75">
                      Clients inside {formatDistance(gymSettings.radiusMeters)} can verify
                      attendance.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {formatDistance(gymSettings.radiusMeters)}
                  </span>
                </div>
                <Slider
                  value={[gymSettings.radiusMeters]}
                  min={50}
                  max={500}
                  step={10}
                  onValueChange={([radiusMeters]) => updateSettings({ radiusMeters })}
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>50 m</span>
                  <span>500 m</span>
                </div>
              </div>

              <details className="group rounded-xl bg-background p-4 ring-1 ring-border/70">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
                  Advanced
                  <span className="text-xs text-muted-foreground/75 group-open:hidden">
                    Lat/Long
                  </span>
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Latitude</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={gymSettings.latitude}
                      onChange={(event) => updateSettings({ latitude: Number(event.target.value) })}
                      className="w-full rounded-md bg-background px-2.5 py-1.5 text-xs ring-1 ring-input/60 transition focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Longitude</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={gymSettings.longitude}
                      onChange={(event) =>
                        updateSettings({ longitude: Number(event.target.value) })
                      }
                      className="w-full rounded-md bg-background px-2.5 py-1.5 text-xs ring-1 ring-input/60 transition focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </label>
                </div>
              </details>

              <p className="text-sm text-muted-foreground/75">
                {trainerDistance === undefined
                  ? "Use current location to compare your device position with the saved gym pin."
                  : `Your device is ${formatDistance(trainerDistance)} from the current gym pin.`}
              </p>
            </div>

            <MapPreview
              settings={gymSettings}
              onLocationSelect={(coordinates) => updateSettings(coordinates)}
            />
          </div>
        </section>

        <AttendanceHistoryPanel entries={entries.slice(0, 7)} />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Client roster</p>
            <h2 className="text-lg font-semibold">Manual attendance override</h2>
          </div>
          <StatusBadge tone="success">Trainer controlled</StatusBadge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((client) => {
            const isMarked = data.entries.some((entry) => entry.clientId === client.id);
            const streak = client.streak ?? 0;
            return (
              <div key={client.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                      {client.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight">{client.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{client.goal}</p>
                    </div>
                  </div>
                  {isMarked && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                    <Clock3 className="h-3.5 w-3.5" /> {streak} day streak
                  </span>
                  <button
                    onClick={() => markManualAttendance(client)}
                    disabled={isMarked || markAttendanceMutation.isPending}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold shadow-soft transition",
                      isMarked
                        ? "bg-success text-success-foreground hover:bg-success/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                      (isMarked || markAttendanceMutation.isPending) && "disabled:opacity-80",
                    )}
                  >
                    <Check className="h-4 w-4" />
                    {isMarked ? "Marked" : markAttendanceMutation.isPending ? "Saving" : "Mark"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const mapZoom = 16;
const mapTileSize = 256;
const maxMapLatitude = 85.05112878;

function MapPreview({
  settings,
  onLocationSelect,
}: {
  settings: GymLocationSettings;
  onLocationSelect: (coordinates: Pick<GymLocationSettings, "latitude" | "longitude">) => void;
}) {
  const isSelectingLocation = useRef(false);
  const center = useMemo(
    () => ({
      tileX: longitudeToTileX(settings.longitude, mapZoom),
      tileY: latitudeToTileY(settings.latitude, mapZoom),
    }),
    [settings.latitude, settings.longitude],
  );
  const centerTileX = Math.floor(center.tileX);
  const centerTileY = Math.floor(center.tileY);
  const tiles = [-1, 0, 1].flatMap((yOffset) =>
    [-1, 0, 1].map((xOffset) => ({
      key: `${centerTileX + xOffset}-${centerTileY + yOffset}`,
      x: centerTileX + xOffset,
      y: centerTileY + yOffset,
    })),
  );

  const selectLocationFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tileX = center.tileX + (event.clientX - rect.left - rect.width / 2) / mapTileSize;
    const tileY = center.tileY + (event.clientY - rect.top - rect.height / 2) / mapTileSize;

    onLocationSelect({
      latitude: Number(tileYToLatitude(tileY, mapZoom).toFixed(6)),
      longitude: Number(tileXToLongitude(tileX, mapZoom).toFixed(6)),
    });
  };

  const startSelectingLocation = (event: PointerEvent<HTMLDivElement>) => {
    isSelectingLocation.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectLocationFromPointer(event);
  };

  const keepSelectingLocation = (event: PointerEvent<HTMLDivElement>) => {
    if (!isSelectingLocation.current) return;
    selectLocationFromPointer(event);
  };

  const stopSelectingLocation = (event: PointerEvent<HTMLDivElement>) => {
    isSelectingLocation.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="relative min-h-[300px] cursor-crosshair touch-none overflow-hidden rounded-xl bg-muted/35 ring-1 ring-border/60"
      role="application"
      aria-label="Mini map. Click or drag to select the gym location."
      onPointerDown={startSelectingLocation}
      onPointerMove={keepSelectingLocation}
      onPointerUp={stopSelectingLocation}
      onPointerCancel={stopSelectingLocation}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={`https://tile.openstreetmap.org/${mapZoom}/${tile.x}/${tile.y}.png`}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none opacity-90"
          style={{
            height: `${mapTileSize}px`,
            left: `calc(50% + ${(tile.x - center.tileX) * mapTileSize}px)`,
            top: `calc(50% + ${(tile.y - center.tileY) * mapTileSize}px)`,
            width: `${mapTileSize}px`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/25" />
      <div
        className="absolute left-1/2 top-1/2 rounded-full bg-primary/10 ring-1 ring-primary/30"
        style={{
          width: `${Math.min(230, Math.max(90, settings.radiusMeters / 2))}px`,
          height: `${Math.min(230, Math.max(90, settings.radiusMeters / 2))}px`,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-soft">
          <MapPin className="h-5 w-5" />
        </span>
        <span className="mt-2 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold shadow-soft">
          {settings.name}
        </span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-background/75 p-3 text-xs backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Attendance perimeter</span>
          <span className="font-semibold text-primary">
            {formatDistance(settings.radiusMeters)}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground/75">
          {settings.latitude.toFixed(5)}, {settings.longitude.toFixed(5)}
        </p>
      </div>
      <p className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
        Click or drag to set pin
      </p>
      <a
        className="absolute bottom-1 right-2 rounded bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        onPointerDown={(event) => event.stopPropagation()}
      >
        OpenStreetMap
      </a>
    </div>
  );
}

function longitudeToTileX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * 2 ** zoom;
}

function latitudeToTileY(latitude: number, zoom: number) {
  const clampedLatitude = Math.min(maxMapLatitude, Math.max(-maxMapLatitude, latitude));
  const radians = (clampedLatitude * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * 2 ** zoom;
}

function tileXToLongitude(tileX: number, zoom: number) {
  return (tileX / 2 ** zoom) * 360 - 180;
}

function tileYToLatitude(tileY: number, zoom: number) {
  const radians = Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / 2 ** zoom)));
  return Math.min(maxMapLatitude, Math.max(-maxMapLatitude, (radians * 180) / Math.PI));
}

function AttendanceHistoryPanel({ entries }: { entries: AttendanceHistoryEntry[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Attendance history</p>
          <h2 className="text-lg font-semibold">Attendance log</h2>
        </div>
        <Navigation className="h-5 w-5 text-primary" />
      </div>

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{entry.clientName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(entry.checkedInAt ?? entry.markedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge tone="success">Marked</StatusBadge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{entry.method ?? "Trainer"}</span>
              <span>Today attendance has been marked.</span>
            </div>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
            No attendance marked today.
          </li>
        )}
      </ul>
    </section>
  );
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}
