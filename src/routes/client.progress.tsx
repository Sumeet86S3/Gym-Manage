import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Image, Lock, TrendingUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import { measurementFields, type BodyMeasurementEntry } from "@/components/measurements/types";
import { useApiResource } from "@/hooks/use-api-resource";
import type { MeasurementRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data: rows, loading } = useApiResource<MeasurementRecord[]>("/measurements", []);
  const [selectedWeek, setSelectedWeek] = useState("");
  const history = useMemo(() => rows.map(normalizeMeasurement).sort(sortByDateDesc), [rows]);
  const filteredHistory = useMemo(
    () =>
      selectedWeek
        ? history.filter((entry) => weekValue(entry.measuredAt) === selectedWeek)
        : history,
    [history, selectedWeek],
  );
  const summary = useMemo(() => buildSummary(history), [history]);

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

      <ClientSummary summary={summary} />
      <ProgressChart history={history} />

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

function ClientSummary({ summary }: { summary: MeasurementSummary }) {
  const cards = [
    { label: "Since start", value: summary.sinceStart ?? "Progress starts with your first check-in" },
    { label: "Latest weight", value: formatMeasurement(summary.latest?.weight, "kg") },
    { label: "Latest waist", value: formatMeasurement(summary.latest?.waist, "cm") },
    { label: "Latest chest", value: formatMeasurement(summary.latest?.chest, "cm") },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </section>
  );
}

function WeekFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  }

  return (
    <label className="w-full text-sm font-medium text-foreground sm:max-w-xs">
      View by week
      <span
        className="relative mt-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-soft transition hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        onClick={openPicker}
      >
        <input
          ref={inputRef}
          type="week"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {value ? formatWeekInput(value) : "Week --, ----"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        {value ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            className="relative z-10 rounded px-1 text-xs font-semibold text-primary hover:underline"
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
                  <th className="px-3 py-3 font-semibold">Weight change</th>
                  <th className="px-3 py-3 font-semibold">Waist change</th>
                  <th className="px-3 py-3 font-semibold">Total cm change</th>
                  {measurementFields.map((field) => (
                    <th key={field.key} className="px-3 py-3 font-semibold">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold">Notes</th>
                  <th className="px-3 py-3 font-semibold">Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rows.map((row, index) => {
                  const previous = rows[index + 1];
                  const deltas = measurementDeltas(row, previous);
                  const photoCount = [row.frontPhotoUrl, row.sidePhotoUrl, row.backPhotoUrl].filter(Boolean).length;
                  return (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-foreground">
                        {formatDate(row.measuredAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {weekLabel(row.measuredAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDelta(deltas.weight, "kg", true)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDelta(deltas.waist, "cm", true)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDelta(deltas.totalCm, "cm", true)}</td>
                      {measurementFields.map((field) => (
                        <td
                          key={field.key}
                          className="whitespace-nowrap px-3 py-3 text-muted-foreground"
                        >
                          {formatMeasurement(row[field.key], field.unit)}
                        </td>
                      ))}
                      <td className="max-w-64 px-3 py-3 text-muted-foreground">
                        <div className="line-clamp-2">{row.trainerNote || row.condition || "-"}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Image className="h-4 w-4" />
                          {photoCount || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
    trainerNote: row.trainerNote,
    condition: row.condition,
    frontPhotoUrl: row.frontPhotoUrl,
    sidePhotoUrl: row.sidePhotoUrl,
    backPhotoUrl: row.backPhotoUrl,
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

function formatWeekInput(value: string) {
  const [year, week] = value.split("-W");
  if (!year || !week) return value;
  return `Week ${Number(week)}, ${year}`;
}

type MeasurementSummary = {
  latest?: BodyMeasurementEntry;
  sinceStart?: string;
};

function buildSummary(history: BodyMeasurementEntry[]): MeasurementSummary {
  if (!history.length) return {};
  const latest = history[0];
  const baseline = history.at(-1);
  const changes = [
    metricChange("Weight", latest.weight, baseline?.weight, "kg", true),
    metricChange("Waist", latest.waist, baseline?.waist, "cm", true),
    metricChange("Chest", latest.chest, baseline?.chest, "cm", false),
  ].filter(Boolean);
  return {
    latest,
    sinceStart: changes.length ? changes.join(" · ") : "Keep checking in to see your trend",
  };
}

function metricChange(label: string, latest?: number, baseline?: number, unit = "", lowerIsGood = false) {
  if (typeof latest !== "number" || typeof baseline !== "number") return undefined;
  const change = latest - baseline;
  const direction = change === 0 ? "steady" : lowerIsGood && change < 0 ? "down" : change > 0 ? "up" : "down";
  return `${label} ${direction} ${Math.abs(change).toFixed(1)} ${unit}`;
}

function measurementDeltas(current: BodyMeasurementEntry, previous?: BodyMeasurementEntry) {
  if (!previous) return { weight: undefined, waist: undefined, totalCm: undefined };
  const bodyKeys = measurementFields
    .filter((field) => field.unit === "cm" && field.key !== "height")
    .map((field) => field.key);
  return {
    weight: delta(current.weight, previous.weight),
    waist: delta(current.waist, previous.waist),
    totalCm: bodyKeys.reduce((total, key) => total + (delta(current[key], previous[key]) ?? 0), 0),
  };
}

function delta(current?: number, previous?: number) {
  if (typeof current !== "number" || typeof previous !== "number") return undefined;
  return current - previous;
}

function formatDelta(value: number | undefined, unit: string, lowerIsGood: boolean) {
  if (typeof value !== "number") return <span className="text-muted-foreground">Start</span>;
  const good = lowerIsGood ? value <= 0 : value >= 0;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        good ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
      }`}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)} {unit}
    </span>
  );
}
