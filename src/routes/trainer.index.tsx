import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, type ReactNode } from "react";
import {
  Users,
  Activity,
  CalendarCheck,
  AlertCircle,
  Flame,
  LocateFixed,
  MapPin,
  MessageSquareHeart,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { feedbackTone } from "@/lib/feedback-utils";
import {
  ChartFallback,
  LazyAttendanceAreaChart,
  LazyRevenueBarChart,
} from "@/components/charts/lazy-metric-charts";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  emptyTrend,
  paymentTrend,
  type Client,
  type FeedbackEntry,
  type PaymentRecord,
} from "@/lib/live-data";
import { toCurrency } from "@/lib/api";
import { formatDistance, readAttendanceHistory, readGymSettings } from "@/lib/attendance";

export const Route = createFileRoute("/trainer/")({
  component: TrainerDashboard,
});

function TrainerDashboard() {
  const { data: clients } = useApiResource<Client[]>("/clients", []);
  const { data: feedback } = useApiResource<FeedbackEntry[]>("/feedback", []);
  const { data: payments } = useApiResource<PaymentRecord[]>("/payments", []);
  const total = clients.length;
  const active = clients.filter((c) => c.status === "Active").length;
  const pendingPayments = payments.filter((p) => p.status !== "Paid").length;
  const inactiveClients = clients.filter(
    (c) => c.status === "Inactive" || c.lastVisit?.includes("days"),
  );
  const revenue = paymentTrend(payments);
  const gymSettings = readGymSettings();
  const attendanceHistory = readAttendanceHistory();
  const verifiedToday = attendanceHistory.filter(
    (entry) =>
      entry.status === "Verified" &&
      new Date(entry.checkedInAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div>
      <PageHeader
        title="Trainer dashboard"
        description="Today at a glance - your studio, your way."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={total} icon={Users} tone="primary" />
        <StatCard label="Active clients" value={active} icon={Activity} tone="success" />
        <StatCard
          label="Today's attendance"
          value={verifiedToday}
          icon={CalendarCheck}
          tone="info"
        />
        <StatCard
          label="Pending payments"
          value={pendingPayments}
          icon={AlertCircle}
          tone="warning"
        />
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
            <Suspense fallback={<ChartFallback />}>
              <LazyAttendanceAreaChart data={emptyTrend} gradientId="trainer-attendance" />
            </Suspense>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Revenue overview</p>
          </div>
          <div className="h-64">
            <Suspense fallback={<ChartFallback />}>
              <LazyRevenueBarChart data={revenue} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gym Location Settings</p>
              <p className="text-lg font-semibold">Attendance zone</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold">{gymSettings.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{gymSettings.address}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-primary">
              <LocateFixed className="h-3.5 w-3.5" />
              Radius {formatDistance(gymSettings.radiusMeters)}
            </div>
          </div>
          <Link
            to="/trainer/attendance"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            Configure location
          </Link>
        </div>

        <DashboardList title="Clients not visited recently" to="/trainer/clients">
          {inactiveClients.slice(0, 4).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {c.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Last visit: {c.lastVisit ?? "-"}
                  </p>
                </div>
              </div>
              <StatusBadge tone={c.status === "Active" ? "success" : "muted"}>
                {c.status}
              </StatusBadge>
            </li>
          ))}
        </DashboardList>

        <DashboardList
          title="Today's feedback"
          to="/trainer/feedback"
          icon={<MessageSquareHeart className="h-4 w-4 text-primary" />}
        >
          {feedback.slice(0, 4).map((f) => {
            const tone = feedbackTone(f);
            return (
              <li key={f.id} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone === "destructive" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.difficulty} - {f.energy} energy - {f.issue}
                  </p>
                </div>
              </li>
            );
          })}
        </DashboardList>

        <DashboardList title="Recent payments" to="/trainer/payments">
          {payments.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.clientName ?? p.client ?? "Client"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{p.plan}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{toCurrency(p.amount)}</p>
                <StatusBadge
                  tone={
                    p.status === "Paid"
                      ? "success"
                      : p.status === "Due Soon"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {p.status}
                </StatusBadge>
              </div>
            </li>
          ))}
        </DashboardList>
      </div>
    </div>
  );
}

function DashboardList({
  title,
  to,
  icon,
  children,
}: {
  title: string;
  to: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h3>
        <Link to={to} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}
