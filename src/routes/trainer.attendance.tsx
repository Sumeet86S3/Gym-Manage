import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { useApiResource } from "@/hooks/use-api-resource";
import type { Client } from "@/lib/live-data";
import {
  calculateDistanceMeters,
  defaultGymSettings,
  formatDistance,
  readAttendanceHistory,
  readGymSettings,
  saveAttendanceHistory,
  saveGymSettings,
  type AttendanceHistoryEntry,
  type GymLocationSettings,
} from "@/lib/attendance";

export const Route = createFileRoute("/trainer/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { data } = useApiResource<{ clients: Client[]; entries: Array<{ clientId: string }> }>(
    "/attendance",
    { clients: [], entries: [] },
  );
  const [gymSettings, setGymSettings] = useState<GymLocationSettings>(defaultGymSettings);
  const [history, setHistory] = useState<AttendanceHistoryEntry[]>([]);
  const [trainerLocation, setTrainerLocation] = useState<{ latitude: number; longitude: number }>();
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGymSettings(readGymSettings());
    setHistory(readAttendanceHistory());
  }, []);

  const todayEntries = history.filter((entry) => isToday(entry.checkedInAt));
  const verifiedToday = todayEntries.filter((entry) => entry.status === "Verified").length;
  const deniedToday = todayEntries.filter((entry) => entry.status === "Denied").length;
  const trainerDistance = useMemo(() => {
    if (!trainerLocation) return undefined;
    return calculateDistanceMeters(gymSettings, trainerLocation);
  }, [gymSettings, trainerLocation]);

  const updateSettings = (patch: Partial<GymLocationSettings>) => {
    setGymSettings((settings) => ({ ...settings, ...patch }));
  };

  const saveSettings = () => {
    const next = { ...gymSettings, updatedAt: new Date().toISOString() };
    setGymSettings(next);
    saveGymSettings(next);
    toast.success("Gym location settings saved for all clients.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location access is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        setTrainerLocation(location);
        setGymSettings((settings) => ({ ...settings, ...location }));
        toast.success("Current location applied to gym settings.");
      },
      () => toast.error("Location permission was denied or unavailable."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const markManualAttendance = (client: Client) => {
    const isMarked =
      marked[client.id] ?? data.entries.some((entry) => entry.clientId === client.id);
    const nextMarked = !isMarked;
    setMarked((items) => ({ ...items, [client.id]: nextMarked }));

    if (nextMarked) {
      const entry: AttendanceHistoryEntry = {
        id: `att-manual-${Date.now()}-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        status: "Manual",
        distanceMeters: 0,
        checkedInAt: new Date().toISOString(),
        method: "Trainer",
      };
      const nextHistory = [entry, ...history].slice(0, 16);
      setHistory(nextHistory);
      saveAttendanceHistory(nextHistory);
    }

    toast.success(nextMarked ? "Manual attendance marked." : "Manual attendance removed.");
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Set your gym perimeter, verify location check-ins, and review attendance history."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified today" value={verifiedToday} icon={ShieldCheck} tone="success" />
        <StatCard label="Denied attempts" value={deniedToday} icon={Radar} tone="warning" />
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
              </div>
              <Button onClick={saveSettings} className="shrink-0">
                <Save className="h-4 w-4" />
                Save settings
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Gym name</span>
                  <input
                    value={gymSettings.name}
                    onChange={(event) => updateSettings({ name: event.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Address label</span>
                  <input
                    value={gymSettings.address}
                    onChange={(event) => updateSettings({ address: event.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={gymSettings.latitude}
                    onChange={(event) => updateSettings({ latitude: Number(event.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={gymSettings.longitude}
                    onChange={(event) => updateSettings({ longitude: Number(event.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Allowed attendance radius</p>
                    <p className="text-xs text-muted-foreground">
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={useCurrentLocation} variant="outline">
                  <Crosshair className="h-4 w-4" />
                  Use current location
                </Button>
                <div className="rounded-lg border border-border bg-muted/45 px-3 py-2 text-sm text-muted-foreground">
                  {trainerDistance === undefined
                    ? "Use current location to compare your device position with the saved gym pin."
                    : `Your device is ${formatDistance(trainerDistance)} from the current gym pin.`}
                </div>
              </div>
            </div>

            <MapPreview settings={gymSettings} />
          </div>
        </section>

        <AttendanceHistoryPanel entries={history.slice(0, 7)} />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Client roster</p>
            <h2 className="text-lg font-semibold">Manual attendance override</h2>
          </div>
          <StatusBadge tone="success">GPS verified badge enabled</StatusBadge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((client) => {
            const isMarked =
              marked[client.id] ?? data.entries.some((entry) => entry.clientId === client.id);
            const streak = client.streak + (isMarked ? 1 : 0);
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
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold shadow-soft transition",
                      isMarked
                        ? "bg-success text-success-foreground hover:bg-success/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    <Check className="h-4 w-4" />
                    {isMarked ? "Marked" : "Mark"}
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

function MapPreview({ settings }: { settings: GymLocationSettings }) {
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-border bg-secondary">
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/15" />
      <div
        className="absolute left-1/2 top-1/2 rounded-full border border-primary/35 bg-primary/10"
        style={{
          width: `${Math.min(230, Math.max(90, settings.radiusMeters / 2))}px`,
          height: `${Math.min(230, Math.max(90, settings.radiusMeters / 2))}px`,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
          <MapPin className="h-6 w-6" />
        </span>
        <span className="mt-2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold shadow-soft">
          {settings.name}
        </span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-card/90 p-3 text-xs shadow-card backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Attendance perimeter</span>
          <span className="font-semibold text-primary">
            {formatDistance(settings.radiusMeters)}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          {settings.latitude.toFixed(5)}, {settings.longitude.toFixed(5)}
        </p>
      </div>
    </div>
  );
}

function AttendanceHistoryPanel({ entries }: { entries: AttendanceHistoryEntry[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Attendance history</p>
          <h2 className="text-lg font-semibold">Live verification log</h2>
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
                  {new Date(entry.checkedInAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge
                tone={
                  entry.status === "Verified"
                    ? "success"
                    : entry.status === "Denied"
                      ? "destructive"
                      : "info"
                }
              >
                {entry.status}
              </StatusBadge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{entry.method}</span>
              <span>
                {entry.status === "Manual"
                  ? "Trainer confirmed"
                  : formatDistance(entry.distanceMeters)}
              </span>
            </div>
          </li>
        ))}
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
