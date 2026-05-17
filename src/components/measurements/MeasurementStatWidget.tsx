import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MeasurementStatWidgetProps {
  title: string;
  value: string;
  helper: string;
  trend?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info";
}

const toneClass = {
  primary: "from-primary/20 to-accent/10 text-primary",
  success: "from-emerald-500/20 to-teal-500/10 text-emerald-600",
  warning: "from-amber-500/20 to-orange-500/10 text-amber-600",
  info: "from-sky-500/20 to-cyan-500/10 text-sky-600",
};

export function MeasurementStatWidget({
  title,
  value,
  helper,
  trend,
  icon: Icon,
  tone = "primary",
}: MeasurementStatWidgetProps) {
  const TrendIcon = trend && trend > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <span className={`rounded-xl bg-gradient-to-br p-3 ${toneClass[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{helper}</span>
        {typeof trend === "number" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-semibold text-foreground">
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
