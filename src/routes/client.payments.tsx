import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { useApiResource } from "@/hooks/use-api-resource";
import { formatDateLabel, toCurrency } from "@/lib/api";
import type { PaymentRecord } from "@/lib/live-data";

export const Route = createFileRoute("/client/payments")({
  component: ClientPayments,
});

function ClientPayments() {
  const { data: history } = useApiResource<PaymentRecord[]>("/payments", []);
  const active = history[0];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Your plan, billing history and upcoming payments."
      />

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active plan</p>
            <h2 className="mt-1 text-2xl font-semibold">{active?.plan ?? "No active plan"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Renews on {formatDateLabel(active?.dueDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold">
              {active ? toCurrency(active.amount) : "₹0"}
              <span className="text-sm font-medium text-muted-foreground">/plan</span>
            </p>
            <StatusBadge
              tone={
                active?.status === "Overdue"
                  ? "destructive"
                  : active?.status === "Due"
                    ? "warning"
                    : "success"
              }
              className="mt-2"
            >
              {active?.status ?? "Inactive"}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-medium">{p.plan}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDateLabel(p.paidAt ?? p.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      tone={
                        p.status === "Paid"
                          ? "success"
                          : p.status === "Due"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {p.status}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDateLabel(p.dueDate)}</td>
                  <td className="px-5 py-4 text-right font-semibold">{toCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
