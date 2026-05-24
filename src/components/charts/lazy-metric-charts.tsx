import { lazy } from "react";

export const LazyAttendanceAreaChart = lazy(() =>
  import("./metric-charts").then((module) => ({ default: module.AttendanceAreaChart })),
);

export const LazyAttendanceBarChart = lazy(() =>
  import("./metric-charts").then((module) => ({ default: module.AttendanceBarChart })),
);

export const LazyRevenueBarChart = lazy(() =>
  import("./metric-charts").then((module) => ({ default: module.RevenueBarChart })),
);

export const LazyRevenueLineChart = lazy(() =>
  import("./metric-charts").then((module) => ({ default: module.RevenueLineChart })),
);

export function ChartFallback() {
  return <div className="h-full w-full animate-pulse rounded-lg bg-muted" />;
}
