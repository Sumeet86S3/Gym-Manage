import { createFileRoute } from "@tanstack/react-router";
import { Users, ShieldCheck, UserCheck, TrendingUp } from "lucide-react";
import { PageHeader, StatCard } from "@/components/app-shell";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  emptyTrend,
  paymentTrend,
  type Client,
  type PaymentRecord,
  type TrainerRecord,
} from "@/lib/live-data";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: trainers } = useApiResource<TrainerRecord[]>("/trainers", []);
  const { data: clients } = useApiResource<Client[]>("/clients", []);
  const { data: payments } = useApiResource<PaymentRecord[]>("/payments", []);
  const total = trainers.length;
  const approved = trainers.filter((t) => t.status === "Approved").length;
  const pending = trainers.filter((t) => t.status === "Pending").length;
  const revenue = paymentTrend(payments);

  return (
    <div>
      <PageHeader title="Admin overview" description="Studio-wide health at a glance." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total trainers"
          value={total}
          delta="+0"
          icon={ShieldCheck}
          tone="primary"
        />
        <StatCard label="Approved trainers" value={approved} icon={UserCheck} tone="success" />
        <StatCard label="Pending approvals" value={pending} icon={UserCheck} tone="warning" />
        <StatCard label="Total clients" value={clients.length} icon={Users} tone="info" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attendance trend</p>
              <p className="text-lg font-semibold">This week</p>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emptyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
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
                  dataKey="visits"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#att)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground">Revenue overview</p>
            <p className="text-lg font-semibold">Paid payments</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
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
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
