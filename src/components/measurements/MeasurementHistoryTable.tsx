import { History } from "lucide-react";
import { measurementFields, type BodyMeasurementEntry } from "./types";

interface MeasurementHistoryTableProps {
  history: BodyMeasurementEntry[];
}

export function MeasurementHistoryTable({ history }: MeasurementHistoryTableProps) {
  const descending = [...history].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Measurement History
          </p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">Client check-in log</h3>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          {history.length} entries
        </span>
      </div>

      {descending.length ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted/90 text-xs uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  {measurementFields.map((field) => (
                    <th key={field.key} className="px-4 py-3 font-semibold">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Weight Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {descending.map((entry, index) => {
                  const previous = descending[index + 1];
                  const change =
                    typeof entry.weight === "number" && typeof previous?.weight === "number"
                      ? entry.weight - previous.weight
                      : undefined;
                  return (
                    <tr key={entry.id} className="transition hover:bg-primary/5">
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-foreground">
                        {new Date(entry.measuredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {measurementFields.map((field) => (
                        <td
                          key={field.key}
                          className="whitespace-nowrap px-4 py-4 text-muted-foreground"
                        >
                          {typeof entry[field.key] === "number"
                            ? `${entry[field.key]?.toFixed(entry[field.key]! % 1 ? 1 : 0)} ${field.unit}`
                            : "--"}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            typeof change !== "number"
                              ? "bg-muted text-muted-foreground"
                              : change <= 0
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {typeof change === "number"
                            ? `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`
                            : "Baseline"}
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
        <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-semibold text-foreground">No history for this client yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save measurements to start building their body transformation record.
          </p>
        </div>
      )}
    </section>
  );
}
