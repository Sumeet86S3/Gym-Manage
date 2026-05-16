import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Battery, Wrench, MessageSquareHeart } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { mockFeedback } from "@/lib/mock-data";
import { feedbackTone } from "@/lib/feedback-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [filter, setFilter] = useState<"All" | "Issues" | "Hard + Low" | "Normal">("All");

  const filtered = mockFeedback.filter((f) => {
    const t = feedbackTone(f);
    if (filter === "All") return true;
    if (filter === "Issues") return t === "destructive";
    if (filter === "Hard + Low") return t === "warning";
    return t === "success";
  });

  return (
    <div>
      <PageHeader
        title="Client daily feedback"
        description="See how each session went and act on flagged sessions fast."
        action={
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1 shadow-soft">
            {(["All", "Issues", "Hard + Low", "Normal"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <SummaryCard icon={AlertTriangle} label="Reported issues" value={mockFeedback.filter((f) => feedbackTone(f) === "destructive").length} tone="destructive" />
        <SummaryCard icon={Battery} label="Hard + low energy" value={mockFeedback.filter((f) => feedbackTone(f) === "warning").length} tone="warning" />
        <SummaryCard icon={MessageSquareHeart} label="Normal sessions" value={mockFeedback.filter((f) => feedbackTone(f) === "success").length} tone="success" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((f) => {
          const tone = feedbackTone(f);
          const borderTone =
            tone === "destructive"
              ? "border-l-destructive"
              : tone === "warning"
                ? "border-l-warning"
                : "border-l-success";
          return (
            <article
              key={f.id}
              className={cn(
                "rounded-2xl border border-border border-l-4 bg-card p-5 shadow-card",
                borderTone,
              )}
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{f.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.workoutName}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{f.date}</span>
              </header>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <StatusBadge tone={f.difficulty === "Hard" ? "destructive" : f.difficulty === "Moderate" ? "warning" : "success"}>
                  Difficulty: {f.difficulty}
                </StatusBadge>
                <StatusBadge tone={f.energy === "Low" ? "destructive" : f.energy === "Normal" ? "info" : "success"}>
                  Energy: {f.energy}
                </StatusBadge>
                <StatusBadge tone={f.issue === "No issue" ? "success" : "destructive"}>
                  {f.issue}
                </StatusBadge>
              </div>

              {f.notes && (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  "{f.notes}"
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {tone === "destructive" ? "🔴 Issue reported" : tone === "warning" ? "🟡 Needs attention" : "🟢 Looks good"}
                </span>
                <button
                  onClick={() => toast.success("Workout modification flow opened (UI only).")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                >
                  <Wrench className="h-3.5 w-3.5" /> Modify workout
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: number;
  tone: "destructive" | "warning" | "success";
}) {
  const toneMap = {
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/25 text-warning-foreground",
    success: "bg-success/15 text-success",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
