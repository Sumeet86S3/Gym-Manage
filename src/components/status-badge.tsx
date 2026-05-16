import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "success" | "warning" | "destructive" | "info" | "muted" | "accent" | "primary";

const tones: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/25 text-warning-foreground border-warning/40",
  destructive: "bg-destructive/12 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
  accent: "bg-accent/15 text-accent border-accent/30",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
