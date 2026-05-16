import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import type { Trainer } from "@/lib/types";
import { useApiResource } from "@/hooks/use-api-resource";

export const Route = createFileRoute("/admin/trainers")({
  component: TrainersPage,
});

function TrainersPage() {
  const { data: trainers } = useApiResource<Trainer[]>("/trainers", []);
  const approved = trainers.filter((t) => t.status === "Approved");
  return (
    <div>
      <PageHeader title="Trainers" description="All approved trainers in your studio." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {approved.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="text-lg font-semibold">{t.clients}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">{t.joinedAt}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge tone="success">{t.status}</StatusBadge>
              <button className="text-xs font-medium text-primary hover:underline">
                View profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
