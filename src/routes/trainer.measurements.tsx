import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, Edit2, Image, Save, StickyNote, Trash2, X, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/app-shell";
import { ProgressChart } from "@/components/measurements/ProgressChart";
import {
  measurementFields,
  type BodyMeasurementEntry,
  type MeasurementKey,
} from "@/components/measurements/types";
import { useApiResource } from "@/hooks/use-api-resource";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";
import type { MeasurementRecord } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/measurements")({
  component: MeasurementsPage,
});

const emptyValues = measurementFields.reduce(
  (values, field) => ({ ...values, [field.key]: "" }),
  {} as Record<MeasurementKey, string>,
);

function MeasurementsPage() {
  const { data: clients, loading: clientsLoading } = useApiResource<Client[]>("/clients", []);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [values, setValues] = useState(emptyValues);
  const [trainerNote, setTrainerNote] = useState("");
  const [condition, setCondition] = useState("");
  const [photoUrls, setPhotoUrls] = useState({ frontPhotoUrl: "", sidePhotoUrl: "", backPhotoUrl: "" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClientId && clients[0]?.id) setSelectedClientId(clients[0].id);
  }, [clients, selectedClientId]);

  const {
    data: rows,
    loading: measurementsLoading,
    reload,
  } = useApiResource<MeasurementRecord[]>(
    selectedClientId ? `/measurements?clientId=${selectedClientId}` : "/measurements?clientId=none",
    [],
  );

  const history = useMemo(() => rows.map(normalizeMeasurement).sort(sortByDateDesc), [rows]);
  const filteredHistory = useMemo(
    () =>
      selectedWeek
        ? history.filter((entry) => weekValue(entry.measuredAt) === selectedWeek)
        : history,
    [history, selectedWeek],
  );
  const hasValue = Object.values(values).some(Boolean);
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const summary = useMemo(() => buildSummary(history), [history]);

  function openDatePicker() {
    if (!selectedClientId || saving) return;
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId || (!hasValue && !trainerNote && !condition && !Object.values(photoUrls).some(Boolean))) return;

    const measuredAt = new Date(`${date}T12:00:00.000Z`).toISOString();
    const duplicate = history.find(
      (entry) => entry.id !== editingId && entry.measuredAt.slice(0, 10) === date,
    );
    if (duplicate && !window.confirm("A measurement already exists for this client/date. Update the existing entry?")) {
      return;
    }
    const payload = measurementFields.reduce(
      (next, field) => {
        const value = values[field.key];
        if (value) next[field.key] = Number(value);
        return next;
      },
      {
        clientId: selectedClientId,
        measuredAt,
        trainerNote: trainerNote.trim() || null,
        condition: condition.trim() || null,
        frontPhotoUrl: photoUrls.frontPhotoUrl.trim() || null,
        sidePhotoUrl: photoUrls.sidePhotoUrl.trim() || null,
        backPhotoUrl: photoUrls.backPhotoUrl.trim() || null,
      } as Record<string, string | number | null>,
    );

    setSaving(true);
    try {
      await api(editingId ? `/measurements/${editingId}` : "/measurements", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(editingId || duplicate ? "Measurement updated." : "Measurements uploaded.");
      resetForm();
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload measurements.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setValues(emptyValues);
    setTrainerNote("");
    setCondition("");
    setPhotoUrls({ frontPhotoUrl: "", sidePhotoUrl: "", backPhotoUrl: "" });
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
  }

  function editEntry(entry: BodyMeasurementEntry) {
    setEditingId(entry.id);
    setDate(entry.measuredAt.slice(0, 10));
    setValues(
      measurementFields.reduce(
        (next, field) => ({ ...next, [field.key]: entry[field.key]?.toString() ?? "" }),
        {} as Record<MeasurementKey, string>,
      ),
    );
    setTrainerNote(entry.trainerNote ?? "");
    setCondition(entry.condition ?? "");
    setPhotoUrls({
      frontPhotoUrl: entry.frontPhotoUrl ?? "",
      sidePhotoUrl: entry.sidePhotoUrl ?? "",
      backPhotoUrl: entry.backPhotoUrl ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEntry(entry: BodyMeasurementEntry) {
    if (!window.confirm(`Delete measurement from ${formatDate(entry.measuredAt)}?`)) return;
    try {
      await api(`/measurements/${entry.id}`, { method: "DELETE" });
      toast.success("Measurement deleted.");
      if (editingId === entry.id) resetForm();
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete measurement.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurements"
        description="Select a client, upload weekly measurements, and review past entries."
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <label className="min-w-0 text-sm font-medium text-foreground">
            Client
            <span className="relative mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-soft transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <select
                value={selectedClientId}
                onChange={(event) => {
                  setSelectedClientId(event.target.value);
                  setSelectedWeek("");
                }}
                className="min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm font-medium text-foreground outline-none"
                disabled={clientsLoading}
              >
                {clients.length ? null : <option value="">No clients found</option>}
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-primary" />
            </span>
          </label>

          <WeekFilter value={selectedWeek} onChange={setSelectedWeek} />
        </div>
      </section>

      {selectedClient ? <LatestSummaryCards summary={summary} /> : null}
      <ProgressChart history={history} />

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            {editingId ? "Edit measurement" : "Upload new measurements"}
            {selectedClient ? ` for ${selectedClient.name}` : ""}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a date for the week, then fill only the values you measured.
          </p>
        </div>

        <form onSubmit={submit}>
          <label className="mb-4 block w-full max-w-xs text-sm font-medium text-foreground">
            Measurement date
            <span
              className="relative mt-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-soft transition hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
              onClick={openDatePicker}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={!selectedClientId || saving}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {formatDateInput(date)}
              </span>
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {measurementFields.map((field) => (
              <label key={field.key} className="text-sm font-medium text-muted-foreground">
                {field.label}
                <span className="mt-1.5 flex items-center rounded-lg border border-input bg-background px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={values[field.key]}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
                    disabled={!selectedClientId || saving}
                  />
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    {field.unit}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
            <label className="text-sm font-medium text-muted-foreground">
              Trainer note
              <span className="mt-1.5 flex rounded-lg border border-input bg-background px-3 py-2">
                <StickyNote className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <textarea
                  value={trainerNote}
                  onChange={(event) => setTrainerNote(event.target.value)}
                  placeholder="Context, wins, or anything to check next time"
                  className="min-h-20 flex-1 resize-none bg-transparent text-sm text-foreground outline-none"
                  disabled={!selectedClientId || saving}
                />
              </span>
            </label>
            <label className="text-sm font-medium text-muted-foreground">
              Measurement condition
              <input
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                placeholder="Morning, fasted"
                className="mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                disabled={!selectedClientId || saving}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {photoFields.map((photo) => (
              <label key={photo.key} className="text-sm font-medium text-muted-foreground">
                {photo.label}
                <span className="mt-1.5 flex items-center rounded-lg border border-input bg-background px-3 py-2">
                  <Image className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  <input
                    type="url"
                    value={photoUrls[photo.key]}
                    onChange={(event) =>
                      setPhotoUrls((current) => ({ ...current, [photo.key]: event.target.value }))
                    }
                    placeholder="https://..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
                    disabled={!selectedClientId || saving}
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!selectedClientId || (!hasValue && !trainerNote && !condition && !Object.values(photoUrls).some(Boolean)) || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Save changes" : "Upload measurements"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <MeasurementTable
        rows={filteredHistory}
        loading={measurementsLoading}
        emptyMessage={
          selectedWeek
            ? "No measurements found for the selected week."
            : "No measurements uploaded for this client yet."
        }
        onEdit={editEntry}
        onDelete={deleteEntry}
      />
    </div>
  );
}

function WeekFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  }

  return (
    <label className="min-w-0 text-sm font-medium text-foreground">
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

function LatestSummaryCards({ summary }: { summary: MeasurementSummary }) {
  const cards = [
    { label: "Latest weight", value: formatMeasurement(summary.latest?.weight, "kg") },
    { label: "Latest waist", value: formatMeasurement(summary.latest?.waist, "cm") },
    { label: "Latest chest", value: formatMeasurement(summary.latest?.chest, "cm") },
    { label: "Last check-in", value: summary.latest ? formatDate(summary.latest.measuredAt) : "-" },
    { label: "Days since", value: summary.daysSince === undefined ? "-" : `${summary.daysSince} days` },
    { label: "Biggest baseline change", value: summary.biggestChange ?? "-" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-lg font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </section>
  );
}

function MeasurementTable({
  rows,
  loading,
  emptyMessage,
  onEdit,
  onDelete,
}: {
  rows: BodyMeasurementEntry[];
  loading: boolean;
  emptyMessage: string;
  onEdit: (entry: BodyMeasurementEntry) => void;
  onDelete: (entry: BodyMeasurementEntry) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Measurement history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Date and week wise entries in a simple table.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {rows.length} entries
        </span>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : rows.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Week</th>
                  <th className="px-3 py-3 font-semibold">Weight change</th>
                  <th className="px-3 py-3 font-semibold">Waist change</th>
                  <th className="px-3 py-3 font-semibold">Chest change</th>
                  <th className="px-3 py-3 font-semibold">Total cm change</th>
                  {measurementFields.map((field) => (
                    <th key={field.key} className="px-3 py-3 font-semibold">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold">Notes</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rows.map((row, index) => {
                  const previous = rows[index + 1];
                  const deltas = measurementDeltas(row, previous);
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
                      <td className="whitespace-nowrap px-3 py-3">{formatDelta(deltas.chest, "cm", false)}</td>
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
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="rounded-md border border-input p-2 text-primary hover:bg-primary/10"
                            aria-label="Edit measurement"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="rounded-md border border-input p-2 text-destructive hover:bg-destructive/10"
                            aria-label="Delete measurement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

function formatDateInput(value: string) {
  if (!value) return "Select date";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type MeasurementSummary = {
  latest?: BodyMeasurementEntry;
  daysSince?: number;
  biggestChange?: string;
};

function buildSummary(history: BodyMeasurementEntry[]): MeasurementSummary {
  if (!history.length) return {};
  const latest = history[0];
  const baseline = history.at(-1);
  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(latest.measuredAt).getTime()) / 86400000),
  );
  const changes = [
    metricChange("Weight", latest.weight, baseline?.weight, "kg"),
    metricChange("Waist", latest.waist, baseline?.waist, "cm"),
    metricChange("Chest", latest.chest, baseline?.chest, "cm"),
    metricChange("Hip", latest.hip, baseline?.hip, "cm"),
  ].filter(Boolean) as string[];
  return { latest, daysSince, biggestChange: changes[0] };
}

function metricChange(label: string, latest?: number, baseline?: number, unit = "") {
  if (typeof latest !== "number" || typeof baseline !== "number") return undefined;
  const change = latest - baseline;
  return `${label} ${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}`;
}

function measurementDeltas(current: BodyMeasurementEntry, previous?: BodyMeasurementEntry) {
  const bodyKeys: MeasurementKey[] = [
    "waist",
    "chest",
    "hip",
    "leftBicep",
    "rightBicep",
    "leftForearm",
    "rightForearm",
    "upperBelly",
    "lowerBelly",
    "leftThigh",
    "rightThigh",
    "leftCalf",
    "rightCalf",
  ];
  return {
    weight: delta(current.weight, previous?.weight),
    waist: delta(current.waist, previous?.waist),
    chest: delta(current.chest, previous?.chest),
    totalCm: bodyKeys.reduce((total, key) => total + (delta(current[key], previous?.[key]) ?? 0), 0),
  };
}

function delta(current?: number, previous?: number) {
  if (typeof current !== "number" || typeof previous !== "number") return undefined;
  return current - previous;
}

function formatDelta(value: number | undefined, unit: string, lowerIsGood: boolean) {
  if (typeof value !== "number") return <span className="text-muted-foreground">Baseline</span>;
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

const photoFields = [
  { key: "frontPhotoUrl", label: "Front photo URL" },
  { key: "sidePhotoUrl", label: "Side photo URL" },
  { key: "backPhotoUrl", label: "Back photo URL" },
] as const;
