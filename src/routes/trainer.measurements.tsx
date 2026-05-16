import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useApiResource } from "@/hooks/use-api-resource";
import { api } from "@/lib/api";
import { measurementsByWeek, type Client, type MeasurementRecord } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/measurements")({
  component: MeasurementsPage,
});

function MeasurementsPage() {
  const { data: clients } = useApiResource<Client[]>("/clients", []);
  const clientId = clients[0]?.id ?? "";
  const { data: rows, reload } = useApiResource<MeasurementRecord[]>(
    clientId ? `/measurements?clientId=${clientId}` : "/measurements?clientId=none",
    [],
  );
  const [form, setForm] = useState({ weight: "", chest: "", waist: "", arms: "" });
  const chart = measurementsByWeek(rows);

  const save = async () => {
    if (!clientId) return;
    await api("/measurements", {
      method: "POST",
      body: JSON.stringify({
        clientId,
        weight: form.weight ? Number(form.weight) : undefined,
        chest: form.chest ? Number(form.chest) : undefined,
        waist: form.waist ? Number(form.waist) : undefined,
        arms: form.arms ? Number(form.arms) : undefined,
      }),
    });
    setForm({ weight: "", chest: "", waist: "", arms: "" });
    toast.success("Measurement saved.");
    reload();
  };

  return (
    <div>
      <PageHeader title="Measurements" description="Track body measurements over time." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">
            {clients[0]?.name ?? "Client"} - progress
          </p>
          <div className="mt-4 h-72">
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
        <form
          className="rounded-2xl border border-border bg-card p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h3 className="text-sm font-semibold">Log new measurement</h3>
          <div className="mt-4 space-y-3">
            {(["weight", "chest", "waist", "arms"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground">
                  {key[0].toUpperCase() + key.slice(1)}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
              Save entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
