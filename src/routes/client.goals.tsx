import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Target } from "lucide-react";
import { useApiResource } from "@/hooks/use-api-resource";
import type { GoalRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/goals")({
  component: ClientGoals,
});

function ClientGoals() {
  const { data: goals } = useApiResource<GoalRecord[]>("/goals", []);
  return (
    <div>
      <PageHeader title="My goals" description="Stay focused - small wins compound." />
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const range = Math.abs(g.targetValue - g.startValue) || 1;
          const progressed = Math.abs(g.currentValue - g.startValue);
          const pct = Math.min(100, Math.round((progressed / range) * 100));
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-xs text-muted-foreground">Updated from backend</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {pct}%
                </span>
              </div>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <GoalValue label="Start" value={g.startValue} unit={g.unit} />
                <GoalValue label="Current" value={g.currentValue} unit={g.unit} active />
                <GoalValue label="Target" value={g.targetValue} unit={g.unit} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalValue({
  label,
  value,
  unit,
  active,
}: {
  label: string;
  value: number;
  unit: string;
  active?: boolean;
}) {
  return (
    <div className={active ? "rounded-lg bg-primary/10 p-3" : "rounded-lg bg-muted/50 p-3"}>
      <p className={active ? "text-primary" : "text-muted-foreground"}>{label}</p>
      <p
        className={
          active
            ? "mt-1 text-base font-semibold text-primary"
            : "mt-1 text-base font-semibold text-foreground"
        }
      >
        {value}
        {unit}
      </p>
    </div>
  );
}
