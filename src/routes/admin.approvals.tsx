import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { mockTrainers, type Trainer } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const [trainers, setTrainers] = useState<Trainer[]>(mockTrainers);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  const filtered = filter === "All" ? trainers : trainers.filter((t) => t.status === filter);

  const update = (id: string, status: Trainer["status"]) => {
    setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    toast.success(`Trainer ${status.toLowerCase()}.`);
  };

  return (
    <div>
      <PageHeader
        title="Trainer approvals"
        description="Review and process trainer applications."
        action={
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1 shadow-soft">
            {(["All", "Pending", "Approved", "Rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Applied</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{t.email}</td>
                  <td className="px-5 py-4 text-muted-foreground">{t.joinedAt}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={t.status === "Approved" ? "success" : t.status === "Pending" ? "warning" : "destructive"}>
                      {t.status}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => update(t.id, "Approved")}
                        disabled={t.status === "Approved"}
                        className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/15 disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => update(t.id, "Rejected")}
                        disabled={t.status === "Rejected"}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/15 disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
