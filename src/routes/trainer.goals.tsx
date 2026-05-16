import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Client, GoalRecord } from "@/lib/live-data";

export const Route = createFileRoute("/trainer/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { data: clients } = useApiResource<Client[]>("/clients", []);
  const { data: goals } = useApiResource<GoalRecord[]>("/goals", []);
  return (
    <div>
      <PageHeader
        title="Client goals"
        description="Track every client's progress toward their target."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const client = clients.find((c) => c.id === g.clientId);
          const range = Math.abs(g.targetValue - g.startValue) || 1;
          const progressed = Math.abs(g.currentValue - g.startValue);
          const pct = Math.min(100, Math.round((progressed / range) * 100));
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{client?.name ?? "Client"}</p>
                  <p className="text-sm text-muted-foreground">{g.title}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {pct}%
                </span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Start: {g.startValue}
                  {g.unit}
                </span>
                <span>
                  Current:{" "}
                  <span className="font-medium text-foreground">
                    {g.currentValue}
                    {g.unit}
                  </span>
                </span>
                <span>
                  Target: {g.targetValue}
                  {g.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
