import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { weightProgress, measurementProgress } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/client/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div>
      <PageHeader title="My progress" description="See how far you've come." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Weight</p>
          <p className="text-2xl font-semibold">78.0 kg <span className="text-sm font-medium text-success">−4.4 kg</span></p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Area type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2} fill="url(#wp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Body measurements</p>
          <p className="text-2xl font-semibold">Chest +2cm</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={measurementProgress} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Legend />
                <Line type="monotone" dataKey="chest" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="waist" stroke="var(--color-accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="arms" stroke="var(--color-info)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
