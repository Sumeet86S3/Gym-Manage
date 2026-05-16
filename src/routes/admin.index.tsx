import { createFileRoute } from "@tanstack/react-router";
import { Users, ShieldCheck, UserCheck, TrendingUp } from "lucide-react";
import { PageHeader, StatCard } from "@/components/app-shell";
import { mockTrainers, mockClients, attendanceTrend, revenueTrend } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const total = mockTrainers.length;
  const approved = mockTrainers.filter((t) => t.status === "Approved").length;
  const pending = mockTrainers.filter((t) => t.status === "Pending").length;

  return (
    <div>
      <PageHeader title="Admin overview" description="Studio-wide health at a glance." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total trainers" value={total} delta="+2" icon={ShieldCheck} tone="primary" />
        <StatCard label="Approved trainers" value={approved} delta="+1" icon={UserCheck} tone="success" />
        <StatCard label="Pending approvals" value={pending} icon={UserCheck} tone="warning" />
        <StatCard label="Total clients" value={mockClients.length * 6} delta="+12%" icon={Users} tone="info" />
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
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Area type="monotone" dataKey="visits" stroke="var(--color-primary)" strokeWidth={2} fill="url(#att)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground">Revenue overview</p>
            <p className="text-lg font-semibold">Last 6 months</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
