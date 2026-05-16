import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { clientGoals } from "@/lib/mock-data";
import { Target } from "lucide-react";

export const Route = createFileRoute("/client/goals")({
  component: ClientGoals,
});

function ClientGoals() {
  return (
    <div>
      <PageHeader title="My goals" description="Stay focused — small wins compound." />
      <div className="grid gap-4 md:grid-cols-2">
        {clientGoals.map((g) => {
          const range = Math.abs(g.target - g.start) || 1;
          const progressed = Math.abs(g.current - g.start);
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
                    <p className="text-xs text-muted-foreground">Updated today</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{pct}%</span>
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Start</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{g.start}{g.unit}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-primary">Current</p>
                  <p className="mt-1 text-base font-semibold text-primary">{g.current}{g.unit}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Target</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{g.target}{g.unit}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
