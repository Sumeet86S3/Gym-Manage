import type { LucideIcon } from "lucide-react";
import { CalendarDays, Dumbbell, Ruler, Save, Scale, Target } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { measurementFields, type BodyMeasurementEntry, type MeasurementKey } from "./types";

interface MeasurementFormProps {
  clientId: string;
  disabled?: boolean;
  onSave: (entry: BodyMeasurementEntry) => Promise<void>;
}

const iconMap: Record<MeasurementKey, LucideIcon> = {
  chest: Ruler,
  arms: Dumbbell,
  upperBelly: Target,
  lowerBelly: Target,
  hip: Ruler,
  waist: Ruler,
  thigh: Dumbbell,
  calf: Dumbbell,
  weight: Scale,
};

const emptyValues = measurementFields.reduce(
  (acc, field) => ({ ...acc, [field.key]: "" }),
  {} as Record<MeasurementKey, string>,
);

export function MeasurementForm({ clientId, disabled, onSave }: MeasurementFormProps) {
  const [values, setValues] = useState(emptyValues);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const hasValue = useMemo(() => Object.values(values).some(Boolean), [values]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId || !hasValue) return;
    setSaving(true);
    const measuredAt = new Date(`${date}T12:00:00.000Z`).toISOString();
    const entry = measurementFields.reduce(
      (acc, field) => {
        const value = values[field.key];
        if (value) acc[field.key] = Number(value);
        return acc;
      },
      {
        id: `local-${clientId}-${Date.now()}`,
        clientId,
        measuredAt,
      } as BodyMeasurementEntry,
    );
    await onSave(entry);
    setValues(emptyValues);
    setDate(new Date().toISOString().slice(0, 10));
    setSaving(false);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-5 shadow-card lg:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Add New Measurements
          </p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">Coach check-in entry</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Record detailed body metrics for a precise transformation timeline.
          </p>
        </div>
        <label className="min-w-48 text-sm font-medium text-muted-foreground">
          Measurement Date
          <span className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={disabled || saving}
              className="w-full bg-transparent text-sm outline-none"
            />
          </span>
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {measurementFields.map((field) => {
          const Icon = iconMap[field.key];
          return (
            <label key={field.key} className="group text-sm font-medium text-muted-foreground">
              {field.label}
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm transition group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/15">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  disabled={disabled || saving}
                  placeholder={field.placeholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {field.unit}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={disabled || saving || !hasValue}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Measurements"}
      </button>
    </form>
  );
}
