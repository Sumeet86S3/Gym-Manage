import { createFileRoute } from "@tanstack/react-router";
import { Activity, Lock, Ruler, Scale, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MeasurementCard } from "@/components/measurements/MeasurementCard";
import { MeasurementHistoryTable } from "@/components/measurements/MeasurementHistoryTable";
import { MeasurementStatWidget } from "@/components/measurements/MeasurementStatWidget";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import { enrichApiMeasurements } from "@/components/measurements/measurement-demo-data";
import { measurementFields, type MeasurementKey } from "@/components/measurements/types";
import { useApiResource } from "@/hooks/use-api-resource";
import type { MeasurementRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data: rows, loading } = useApiResource<MeasurementRecord[]>("/measurements", []);
  const history = enrichApiMeasurements(rows, rows[0]?.clientId ?? "").sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
  );
  const latest = history.at(-1);
  const baseline = history[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My progress"
        description="Your trainer-uploaded body measurements and transformation history."
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Private Client View
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Progress shared by your trainer
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This page only requests measurements for your logged-in client account.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Lock className="h-3.5 w-3.5" />
            Client-only data
          </span>
        </div>
      </section>

      {loading ? (
        <ClientProgressSkeleton />
      ) : history.length ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MeasurementStatWidget
              title="Current Weight"
              value={formatMetric(latest?.weight, "kg")}
              helper="Latest trainer check-in"
              trend={percentChange(baseline?.weight, latest?.weight)}
              icon={Scale}
              tone="primary"
            />
            <MeasurementStatWidget
              title="Waist"
              value={formatMetric(latest?.waist, "cm")}
              helper="Core progress marker"
              trend={percentChange(baseline?.waist, latest?.waist)}
              icon={Ruler}
              tone="success"
            />
            <MeasurementStatWidget
              title="Total Change"
              value={formatDelta(difference(baseline?.weight, latest?.weight), "kg")}
              helper="Weight since baseline"
              icon={TrendingDown}
              tone="info"
            />
            <MeasurementStatWidget
              title="Latest Update"
              value={latest ? formatDate(latest.measuredAt) : "--"}
              helper={`${history.length} check-ins uploaded`}
              icon={Activity}
              tone="warning"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {measurementFields.map((field) => (
              <MeasurementCard
                key={field.key}
                label={field.label}
                value={latest?.[field.key]}
                unit={field.unit}
                change={difference(baseline?.[field.key], latest?.[field.key])}
                icon={metricIcon(field.key)}
                compact
              />
            ))}
          </section>

          <ProgressChart history={history} />
          <MeasurementHistoryTable history={history} />
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-foreground">No measurements uploaded yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once your trainer logs your body measurements, your progress charts and history will
            appear here.
          </p>
        </section>
      )}
    </div>
  );
}

function ClientProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function formatMetric(value: number | undefined, unit: string) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(value % 1 ? 1 : 0)} ${unit}`;
}

function formatDelta(value: number | undefined, unit: string) {
  if (typeof value !== "number") return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} ${unit}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function difference(start?: number, latest?: number) {
  if (typeof start !== "number" || typeof latest !== "number") return undefined;
  return latest - start;
}

function percentChange(start?: number, latest?: number) {
  if (!start || typeof latest !== "number") return undefined;
  return ((latest - start) / start) * 100;
}

function metricIcon(key: MeasurementKey) {
  if (key === "weight") return Scale;
  if (key === "arms" || key === "thigh" || key === "calf") return Activity;
  return Ruler;
}
