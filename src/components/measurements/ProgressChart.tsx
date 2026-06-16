import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import type { BodyMeasurementEntry } from "./types";

interface ProgressChartProps {
  history: BodyMeasurementEntry[];
}

export function ProgressChart({ history }: ProgressChartProps) {
  const [metric, setMetric] = useState<"weight" | "waist" | "chest" | "hip">("weight");
  const ascending = useMemo(
    () => [...history].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()),
    [history],
  );
  const chartData = ascending.map((entry) => ({
    date: new Date(entry.measuredAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    weight: entry.weight,
    waist: entry.waist,
    chest: entry.chest,
    hip: entry.hip,
  }));
  const first = ascending[0];
  const latest = ascending.at(-1);
  const change =
    typeof first?.[metric] === "number" && typeof latest?.[metric] === "number"
      ? latest[metric]! - first[metric]!
      : undefined;

  if (!history.length) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-foreground">No progress data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a client and save the first measurement entry to unlock analytics.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Progress Analytics
          </p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">Transformation trends</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {metricOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMetric(option.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                metric === option.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="text-sm text-muted-foreground">{history.length} check-ins</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>From first to latest:</span>
        <span className="rounded-full bg-muted px-3 py-1 font-semibold text-foreground">
          {typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}` : "-"}
          {" "}
          {metric === "weight" ? "kg" : "cm"}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-72 rounded-xl border border-border bg-background/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 18, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="weightTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waistTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey={metric}
                name={metricOptions.find((option) => option.key === metric)?.name}
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#weightTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-popover)",
  boxShadow: "0 18px 45px rgb(15 23 42 / 0.16)",
};

const metricOptions = [
  { key: "weight", label: "Weight", name: "Weight kg" },
  { key: "waist", label: "Waist", name: "Waist cm" },
  { key: "chest", label: "Chest", name: "Chest cm" },
  { key: "hip", label: "Hip", name: "Hip cm" },
] as const;
