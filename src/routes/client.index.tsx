import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Dumbbell, Flame } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { mockWorkout } from "@/lib/mock-data";
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

export const Route = createFileRoute("/client/")({
  component: ClientWorkouts,
});

type Difficulty = "Easy" | "Moderate" | "Hard";
type Energy = "Low" | "Normal" | "High";
type Issue = "No issue" | "Joint pain" | "Muscle soreness" | "Other";

function ClientWorkouts() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Moderate");
  const [energy, setEnergy] = useState<Energy>("Normal");
  const [issue, setIssue] = useState<Issue>("No issue");
  const [otherIssue, setOtherIssue] = useState("");
  const [notes, setNotes] = useState("");

  const open = !!activeId;
  const close = () => {
    setActiveId(null);
    setDifficulty("Moderate");
    setEnergy("Normal");
    setIssue("No issue");
    setOtherIssue("");
    setNotes("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeId) setCompleted((c) => ({ ...c, [activeId]: true }));
    toast.success("Feedback submitted. Great work today! 💪");
    close();
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const total = mockWorkout.exercises.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div>
      <PageHeader
        title="Today's workout"
        description="Tap done after each exercise — we'll log your feedback in seconds."
      />

      <div className="mb-6 rounded-2xl border border-border bg-gradient-primary p-6 text-primary-foreground shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-90">{mockWorkout.type}</p>
            <h2 className="mt-1 text-2xl font-semibold">{mockWorkout.name}</h2>
            <p className="mt-1 text-sm opacity-90">{total} exercises · ~45 min</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1.5 text-sm font-semibold backdrop-blur">
            <Flame className="h-4 w-4" /> 5-day streak
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>Progress</span>
            <span>{doneCount} / {total}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-primary-foreground/90 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {mockWorkout.exercises.map((e) => {
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
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", done ? "bg-success/15 text-success" : "bg-primary/10 text-primary")}>
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
            <DialogDescription>Takes 10 seconds. Helps your trainer adjust your plan.</DialogDescription>
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
              <label className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
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
