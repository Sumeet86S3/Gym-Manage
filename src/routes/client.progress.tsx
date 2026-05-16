import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useApiResource } from "@/hooks/use-api-resource";
import { measurementsByWeek, type MeasurementRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data: rows } = useApiResource<MeasurementRecord[]>("/measurements", []);
  const chart = measurementsByWeek(rows);
  const latest = rows.at(-1);
  const first = rows[0];
  const delta = latest?.weight && first?.weight ? latest.weight - first.weight : 0;

  return (
    <div>
      <PageHeader title="My progress" description="See how far you've come." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Weight</p>
          <p className="text-2xl font-semibold">
            {latest?.weight ?? "-"} kg{" "}
            <span className="text-sm font-medium text-success">{delta.toFixed(1)} kg</span>
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-popover)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#wp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Body measurements</p>
          <p className="text-2xl font-semibold">Latest entries</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-popover)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="chest"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="waist"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="arms" stroke="var(--color-info)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
