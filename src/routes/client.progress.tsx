import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { measurementFields, type BodyMeasurementEntry } from "@/components/measurements/types";
import { useApiResource } from "@/hooks/use-api-resource";
import type { MeasurementRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data: rows, loading } = useApiResource<MeasurementRecord[]>("/measurements", []);
  const [selectedWeek, setSelectedWeek] = useState("");
  const history = useMemo(
    () => rows.map(normalizeMeasurement).sort(sortByDateDesc),
    [rows],
  );
  const filteredHistory = useMemo(
    () => (selectedWeek ? history.filter((entry) => weekValue(entry.measuredAt) === selectedWeek) : history),
    [history, selectedWeek],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My progress"
        description="Your body measurements uploaded by your trainer."
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Lock className="h-3.5 w-3.5" />
              Your data only
            </span>
            <h2 className="mt-3 text-lg font-semibold text-foreground">Measurement history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your entries by date or filter them week wise.
            </p>
          </div>
          <WeekFilter value={selectedWeek} onChange={setSelectedWeek} />
        </div>
      </section>

      <MeasurementTable
        rows={filteredHistory}
        loading={loading}
        emptyMessage={
          selectedWeek
            ? "No measurements found for the selected week."
            : "No measurements uploaded yet."
        }
      />
    </div>
  );
}

function WeekFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="w-full text-sm font-medium text-foreground sm:max-w-xs">
      View by week
      <span className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-soft transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          type="week"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            All
          </button>
        ) : null}
      </span>
    </label>
  );
}

function MeasurementTable({
  rows,
  loading,
  emptyMessage,
}: {
  rows: BodyMeasurementEntry[];
  loading: boolean;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : rows.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Week</th>
                  {measurementFields.map((field) => (
                    <th key={field.key} className="px-3 py-3 font-semibold">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                      {formatDate(row.measuredAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {weekLabel(row.measuredAt)}
                    </td>
                    {measurementFields.map((field) => (
                      <td key={field.key} className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {formatMeasurement(row[field.key], field.unit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-semibold text-foreground">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}

function normalizeMeasurement(row: MeasurementRecord): BodyMeasurementEntry {
  return {
    id: row.id,
    clientId: row.clientId,
    measuredAt: row.measuredAt,
    chest: row.chest,
    leftBicep: row.leftBicep ?? row.arms,
    rightBicep: row.rightBicep ?? row.arms,
    leftForearm: row.leftForearm,
    rightForearm: row.rightForearm,
    upperBelly: row.upperBelly,
    lowerBelly: row.lowerBelly,
    waist: row.waist,
    hip: row.hip,
    leftThigh: row.leftThigh ?? row.thigh,
    rightThigh: row.rightThigh ?? row.thigh,
    leftCalf: row.leftCalf ?? row.calf,
    rightCalf: row.rightCalf ?? row.calf,
    weight: row.weight,
    height: row.height,
  };
}

function sortByDateDesc(a: BodyMeasurementEntry, b: BodyMeasurementEntry) {
  return new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime();
}

function formatMeasurement(value: number | undefined, unit: string) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(value % 1 ? 1 : 0)} ${unit}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function weekValue(value: string) {
  const date = new Date(value);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(value: string) {
  const [, week] = weekValue(value).split("-W");
  return `Week ${Number(week)}`;
}
