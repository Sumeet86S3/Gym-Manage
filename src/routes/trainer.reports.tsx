import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import {
  ChartFallback,
  LazyAttendanceAreaChart,
  LazyRevenueBarChart,
} from "@/components/charts/lazy-metric-charts";
import { useApiResource } from "@/hooks/use-api-resource";
import { emptyTrend, paymentTrend, type PaymentRecord } from "@/lib/live-data";

export const Route = createFileRoute("/trainer/reports")({
  component: TrainerReports,
});

function TrainerReports() {
  const { data: payments } = useApiResource<PaymentRecord[]>("/payments", []);
  const revenue = paymentTrend(payments);

  return (
    <div>
      <PageHeader title="Reports" description="Your client activity and revenue trends." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Attendance</p>
          <div className="mt-4 h-72">
            <Suspense fallback={<ChartFallback />}>
              <LazyAttendanceAreaChart data={emptyTrend} gradientId="trainer-reports-attendance" />
            </Suspense>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
          <div className="mt-4 h-72">
            <Suspense fallback={<ChartFallback />}>
              <LazyRevenueBarChart data={revenue} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
