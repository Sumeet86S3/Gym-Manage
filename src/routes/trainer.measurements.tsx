import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { measurementProgress } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/trainer/measurements")({
  component: MeasurementsPage,
});

function MeasurementsPage() {
  return (
    <div>
      <PageHeader title="Measurements" description="Track body measurements over time." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">Olivia Bennett — last 6 weeks</p>
          <div className="mt-4 h-72">
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
        <form className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">Log new measurement</h3>
          <div className="mt-4 space-y-3">
            {["Weight (kg)", "Chest (cm)", "Waist (cm)", "Arms (cm)"].map((l) => (
              <div key={l}>
                <label className="text-xs font-medium text-muted-foreground">{l}</label>
                <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <button type="button" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
              Save entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
