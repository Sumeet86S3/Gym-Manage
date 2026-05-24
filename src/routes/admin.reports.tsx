import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import {
  ChartFallback,
  LazyAttendanceBarChart,
  LazyRevenueLineChart,
} from "@/components/charts/lazy-metric-charts";
import { useApiResource } from "@/hooks/use-api-resource";
import { emptyTrend, paymentTrend, type PaymentRecord } from "@/lib/live-data";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: payments } = useApiResource<PaymentRecord[]>("/payments", []);
  const revenue = paymentTrend(payments);
  const total = payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader title="Reports" description="Track studio performance over time." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Revenue growth</p>
          <p className="text-2xl font-semibold">₹{total.toLocaleString("en-IN")}</p>
          <div className="mt-4 h-72">
            <Suspense fallback={<ChartFallback />}>
              <LazyRevenueLineChart data={revenue} />
            </Suspense>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Weekly attendance</p>
          <p className="text-2xl font-semibold">Live check-ins</p>
          <div className="mt-4 h-72">
            <Suspense fallback={<ChartFallback />}>
              <LazyAttendanceBarChart data={emptyTrend} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
