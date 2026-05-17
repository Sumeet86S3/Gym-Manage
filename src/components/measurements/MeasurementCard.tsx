import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface MeasurementCardProps {
  label: string;
  value?: number;
  unit: string;
  change?: number;
  icon: LucideIcon;
  compact?: boolean;
}

export function MeasurementCard({
  label,
  value,
  unit,
  change,
  icon: Icon,
  compact,
}: MeasurementCardProps) {
  const trendTone =
    typeof change !== "number"
      ? "text-muted-foreground"
      : change < 0
        ? "text-emerald-600"
        : change > 0
          ? "text-amber-600"
          : "text-muted-foreground";
  const TrendIcon =
    typeof change !== "number" || change === 0 ? Minus : change > 0 ? ArrowUp : ArrowDown;

  return (
    <div className="rounded-xl border border-border bg-background/80 p-4 transition hover:border-primary/30 hover:bg-primary/5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendTone}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {typeof change === "number" ? Math.abs(change).toFixed(1) : "0"} {unit}
        </span>
      </div>
      <p className={`${compact ? "mt-2 text-xl" : "mt-4 text-2xl"} font-bold text-foreground`}>
        {typeof value === "number" ? value.toFixed(value % 1 ? 1 : 0) : "--"}
        <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
