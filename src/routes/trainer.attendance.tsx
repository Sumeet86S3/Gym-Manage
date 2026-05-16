import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Check } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { mockClients } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setMarked((m) => {
      const next = { ...m, [id]: !m[id] };
      toast.success(next[id] ? "Attendance marked." : "Attendance removed.");
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Mark today's check-ins and keep streaks alive." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {mockClients.map((c) => {
          const isMarked = marked[c.id];
          const streak = c.streak + (isMarked ? 1 : 0);
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.goal}</p>
                  </div>
                </div>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
                    <Flame className="h-3.5 w-3.5" /> {streak} days
                  </span>
                )}
              </div>
              <button
                onClick={() => toggle(c.id)}
                className={cn(
                  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition shadow-soft",
                  isMarked
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                <Check className="h-4 w-4" /> {isMarked ? "Marked present" : "Mark present"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
