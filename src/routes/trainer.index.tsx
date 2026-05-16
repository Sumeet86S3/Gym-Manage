import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Activity, CalendarCheck, AlertCircle, Flame, MessageSquareHeart } from "lucide-react";
import { PageHeader, StatCard } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  mockClients,
  mockFeedback,
  recentPayments,
  attendanceTrend,
  revenueTrend,
} from "@/lib/mock-data";
import { feedbackTone } from "@/lib/feedback-utils";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/trainer/")({
  component: TrainerDashboard,
});

function TrainerDashboard() {
  const total = mockClients.length;
  const active = mockClients.filter((c) => c.status === "Active").length;
  const todayAttendance = 12;
  const pendingPayments = mockClients.filter((c) => c.paymentStatus !== "Paid").length;
  const inactiveClients = mockClients.filter((c) => c.lastVisit.includes("days") || c.lastVisit.includes("week"));

  return (
    <div>
      <PageHeader title="Trainer dashboard" description="Today at a glance — your studio, your way." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={total} icon={Users} tone="primary" />
        <StatCard label="Active clients" value={active} delta="+3" icon={Activity} tone="success" />
        <StatCard label="Today's attendance" value={todayAttendance} icon={CalendarCheck} tone="info" />
        <StatCard label="Pending payments" value={pendingPayments} icon={AlertCircle} tone="warning" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attendance trend</p>
              <p className="text-lg font-semibold">This week</p>
            </div>
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="att2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Area type="monotone" dataKey="visits" stroke="var(--color-primary)" strokeWidth={2} fill="url(#att2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Revenue overview</p>
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Clients not visited recently</h3>
            <Link to="/trainer/clients" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {inactiveClients.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Last visit: {c.lastVisit}</p>
                  </div>
                </div>
                <StatusBadge tone={c.status === "Active" ? "success" : "muted"}>{c.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareHeart className="h-4 w-4 text-primary" /> Today's feedback
            </h3>
            <Link to="/trainer/feedback" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {mockFeedback.slice(0, 4).map((f) => {
              const tone = feedbackTone(f);
              return (
                <li key={f.id} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone === "destructive" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.difficulty} · {f.energy} energy · {f.issue}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent payments</h3>
            <Link to="/trainer/payments" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-3">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.client}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.plan} · {p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{p.amount.toLocaleString("en-IN")}</p>
                  <StatusBadge tone={p.status === "Paid" ? "success" : p.status === "Due" ? "warning" : "destructive"}>{p.status}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
