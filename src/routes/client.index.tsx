import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Workout } from "@/lib/live-data";
import {
  calculateDistanceMeters,
  defaultGymSettings,
  formatDistance,
  readGymSettings,
  normalizeAttendanceEntry,
  useAttendance,
  useMarkAttendance,
  type AttendanceHistoryEntry,
  type GymLocationSettings,
} from "@/lib/attendance";

export const Route = createFileRoute("/client/")({
  component: ClientWorkouts,
});

type Difficulty = "Easy" | "Moderate" | "Hard";
type Energy = "Low" | "Normal" | "High";
type Issue = "No issue" | "Joint pain" | "Muscle soreness" | "Other";

function ClientWorkouts() {
  const { data: workout } = useApiResource<Workout>("/workouts/today", {
    id: "",
    name: "No workout assigned",
    type: "Workout",
    exercises: [],
  });
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Moderate");
  const [energy, setEnergy] = useState<Energy>("Normal");
  const [issue, setIssue] = useState<Issue>("No issue");
  const [otherIssue, setOtherIssue] = useState("");
  const [notes, setNotes] = useState("");
  const [gymSettings, setGymSettings] = useState<GymLocationSettings>(defaultGymSettings);
  const [clientLocation, setClientLocation] = useState<{ latitude: number; longitude: number }>();
  const [attendanceStatus, setAttendanceStatus] = useState<
    "idle" | "checking" | "verified" | "denied"
  >("idle");
  const attendance = useAttendance();
  const markAttendanceMutation = useMarkAttendance();

  useEffect(() => {
    setGymSettings(readGymSettings());
  }, []);

  const open = !!activeId;
  const close = () => {
    setActiveId(null);
    setDifficulty("Moderate");
    setEnergy("Normal");
    setIssue("No issue");
    setOtherIssue("");
    setNotes("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeId) {
      await api(`/workouts/exercises/${activeId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          workoutId: workout.id,
          difficulty,
          energy,
          issue,
          notes: issue === "Other" ? `${otherIssue}${notes ? ` - ${notes}` : ""}` : notes,
        }),
      });
      setCompleted((c) => ({ ...c, [activeId]: true }));
    }
    toast.success("Feedback submitted. Great work today! 💪");
    close();
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const total = workout.exercises.length;
  const pct = Math.round((doneCount / total) * 100);
  const currentDistance = useMemo(() => {
    if (!clientLocation) return undefined;
    return calculateDistanceMeters(gymSettings, clientLocation);
  }, [clientLocation, gymSettings]);
  const insideRadius = currentDistance !== undefined && currentDistance <= gymSettings.radiusMeters;
  const attendanceEntries = (attendance.data?.entries ?? []).map(normalizeAttendanceEntry);
  const todayEntry = attendance.data?.todayEntry
    ? normalizeAttendanceEntry(attendance.data.todayEntry)
    : attendanceEntries.find((entry) => isToday(entry.markedAt));
  const alreadyMarked = Boolean(todayEntry);
  const clientHistory = attendanceEntries.slice(0, 4);

  const markAttendance = () => {
    if (alreadyMarked) return;
    if (!navigator.geolocation) {
      toast.error("Location access is not available on this device.");
      return;
    }

    setAttendanceStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const distance = calculateDistanceMeters(gymSettings, location);
        const verified = distance <= gymSettings.radiusMeters;

        setClientLocation(location);
        if (!verified) {
          setAttendanceStatus("denied");
          toast.error("Attendance denied. Move closer to the gym location.");
          return;
        }

        markAttendanceMutation.mutate(undefined, {
          onSuccess: (result) => {
            setAttendanceStatus("verified");
            toast.success(
              result.alreadyMarked
                ? "Today attendance has been marked."
                : "Attendance marked successfully.",
            );
          },
          onError: (error) => {
            setAttendanceStatus("idle");
            toast.error(error instanceof Error ? error.message : "Unable to mark attendance.");
          },
        });
      },
      () => {
        setAttendanceStatus("idle");
        toast.error("Location permission was denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div>
      <PageHeader
        title="Today's workout"
        description="Tap done after each exercise — we'll log your feedback in seconds."
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border bg-gradient-to-r from-primary/12 via-card to-accent/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  Smart location attendance
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Today's check-in</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Verify from your device location within {formatDistance(gymSettings.radiusMeters)}{" "}
                  of {gymSettings.name}.
                </p>
              </div>
              <AttendanceBadge status={alreadyMarked ? "marked" : attendanceStatus} />
            </div>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricTile
                  label="Gym radius"
                  value={formatDistance(gymSettings.radiusMeters)}
                  icon={<LocateFixed className="h-4 w-4" />}
                />
                <MetricTile
                  label="Your distance"
                  value={
                    currentDistance === undefined ? "Waiting" : formatDistance(currentDistance)
                  }
                  icon={<Navigation className="h-4 w-4" />}
                />
                <MetricTile
                  label="Status"
                  value={
                    alreadyMarked
                      ? "Marked"
                      : attendanceStatus === "verified"
                      ? "Verified"
                      : attendanceStatus === "denied"
                        ? "Denied"
                        : "Ready"
                  }
                  icon={
                    attendanceStatus === "denied" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )
                  }
                />
              </div>

              <div
                className={cn(
                  "rounded-xl border p-4 text-sm",
                  alreadyMarked || attendanceStatus === "verified"
                    ? "border-success/30 bg-success/10 text-success"
                    : attendanceStatus === "denied"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted/45 text-muted-foreground",
                )}
              >
                {alreadyMarked
                  ? "Today attendance has been marked."
                  : currentDistance === undefined
                  ? "Tap Mark Attendance to request location access and calculate your real-time gym distance."
                  : insideRadius
                    ? `You are ${formatDistance(currentDistance)} away, inside the approved radius.`
                    : `You are ${formatDistance(currentDistance)} away, outside the approved radius.`}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border bg-background p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gym location
                </p>
                <p className="mt-1 font-semibold">{gymSettings.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{gymSettings.address}</p>
              </div>
              {alreadyMarked ? (
                <div className="mt-4 rounded-lg border border-success/25 bg-success/10 px-3 py-2.5 text-sm font-medium text-success">
                  Today attendance has been marked.
                </div>
              ) : (
                <button
                  onClick={markAttendance}
                  disabled={attendanceStatus === "checking" || markAttendanceMutation.isPending}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {attendanceStatus === "checking" || markAttendanceMutation.isPending ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {attendanceStatus === "checking" || markAttendanceMutation.isPending
                    ? "Checking location"
                    : "Mark Attendance"}
                </button>
              )}
            </div>
          </div>
        </div>

        <AttendanceHistoryCard entries={clientHistory} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-90">{workout.type}</p>
            <h2 className="mt-1 text-2xl font-semibold">{workout.name}</h2>
            <p className="mt-1 text-sm opacity-90">{total} exercises · ~45 min</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-sm font-semibold backdrop-blur">
            <Flame className="h-4 w-4" /> 5-day streak
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>Progress</span>
            <span>
              {doneCount} / {total}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground/90 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {workout.exercises.map((e) => {
          const done = completed[e.id];
          return (
            <li
              key={e.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                done && "opacity-70",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    done ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className={cn("font-semibold", done && "line-through")}>{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.sets} sets × {e.reps} reps{e.weight > 0 ? ` · ${e.weight} kg` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveId(e.id)}
                disabled={done}
                className={cn(
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-soft transition",
                  done
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {done ? "Completed" : "Mark as completed"}
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick session feedback</DialogTitle>
            <DialogDescription>
              Takes 10 seconds. Helps your trainer adjust your plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <SegmentField
              label="Workout difficulty"
              options={["Easy", "Moderate", "Hard"]}
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty)}
            />
            <SegmentField
              label="Energy level"
              options={["Low", "Normal", "High"]}
              value={energy}
              onChange={(v) => setEnergy(v as Energy)}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Any issues?</p>
              <div className="grid grid-cols-2 gap-2">
                {(["No issue", "Joint pain", "Muscle soreness", "Other"] as Issue[]).map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                      issue === opt
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="issue"
                      className="sr-only"
                      checked={issue === opt}
                      onChange={() => setIssue(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {issue === "Other" && (
                <input
                  value={otherIssue}
                  onChange={(e) => setOtherIssue(e.target.value)}
                  placeholder="Describe briefly…"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything else your trainer should know?"
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
              >
                Submit
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttendanceBadge({
  status,
}: {
  status: "idle" | "checking" | "verified" | "denied" | "marked";
}) {
  const styles = {
    idle: "bg-muted text-muted-foreground",
    checking: "bg-info/15 text-info",
    verified: "bg-success/15 text-success",
    denied: "bg-destructive/15 text-destructive",
    marked: "bg-success/15 text-success",
  };
  const label = {
    idle: "Not marked",
    checking: "Verifying",
    verified: "Verified attendance",
    denied: "Outside radius",
    marked: "Marked today",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        styles[status],
      )}
    >
      {status === "denied" ? (
        <XCircle className="h-3.5 w-3.5" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5" />
      )}
      {label[status]}
    </span>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function AttendanceHistoryCard({ entries }: { entries: AttendanceHistoryEntry[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Attendance history</p>
          <h3 className="text-lg font-semibold">Recent check-ins</h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Clock3 className="h-5 w-5" />
        </span>
      </div>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {new Date(entry.checkedInAt ?? entry.markedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.checkedInAt ?? entry.markedAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                - Attendance marked
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                "bg-success/15 text-success",
              )}
            >
              Marked
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="rounded-xl bg-muted/45 p-3 text-sm text-muted-foreground">
            No attendance marked yet.
          </li>
        )}
      </ul>
    </div>
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

function SegmentField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition",
              value === opt
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
