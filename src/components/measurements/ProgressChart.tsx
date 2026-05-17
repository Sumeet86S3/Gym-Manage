import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BodyMeasurementEntry } from "./types";

interface ProgressChartProps {
  history: BodyMeasurementEntry[];
}

export function ProgressChart({ history }: ProgressChartProps) {
  const chartData = history.map((entry) => ({
    date: new Date(entry.measuredAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    weight: entry.weight,
    waist: entry.waist,
    chest: entry.chest,
    hip: entry.hip,
  }));
  const first = history[0];
  const latest = history.at(-1);
  const comparison = [
    { metric: "Weight", start: first?.weight ?? 0, latest: latest?.weight ?? 0 },
    { metric: "Waist", start: first?.waist ?? 0, latest: latest?.waist ?? 0 },
    { metric: "Chest", start: first?.chest ?? 0, latest: latest?.chest ?? 0 },
    { metric: "Hip", start: first?.hip ?? 0, latest: latest?.hip ?? 0 },
  ];

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
        <p className="text-sm text-muted-foreground">{history.length} check-ins tracked</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="h-80 rounded-xl border border-border bg-background/70 p-3">
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
                dataKey="weight"
                name="Weight kg"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#weightTrend)"
              />
              <Area
                type="monotone"
                dataKey="waist"
                name="Waist cm"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                fill="url(#waistTrend)"
              />
              <Area
                type="monotone"
                dataKey="chest"
                name="Chest cm"
                stroke="var(--color-info)"
                strokeWidth={2.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80 rounded-xl border border-border bg-background/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="metric"
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
              <Bar
                dataKey="start"
                name="Start"
                fill="var(--color-muted-foreground)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="latest"
                name="Latest"
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
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
