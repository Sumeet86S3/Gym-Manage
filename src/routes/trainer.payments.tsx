import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { useApiResource } from "@/hooks/use-api-resource";
import { api } from "@/lib/api";
import { formatDateLabel, toCurrency } from "@/lib/api";
import type { PaymentRecord } from "@/lib/live-data";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: payments, setData: setPayments } = useApiResource<PaymentRecord[]>("/payments", []);

  const markPaid = async (payment: PaymentRecord) => {
    try {
      const updated = await api<PaymentRecord>(`/payments/${payment.id}/mark-paid`, {
        method: "PATCH",
      });
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                status: updated.status,
                paidAt: updated.paidAt,
                dueDate: updated.dueDate,
              }
            : item,
        ),
      );
      toast.success("Payment marked paid.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to mark payment paid.");
    }
  };

  return (
    <div>
      <PageHeader title="Payments" description="Track plans, due dates and outstanding balances." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const clientName = p.clientName ?? p.client ?? "Client";
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {clientName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span className="font-medium">{clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{p.plan}</td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        tone={
                          p.status === "Paid"
                            ? "success"
                            : p.status === "Due Soon"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {p.status}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateLabel(p.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">{toCurrency(p.amount)}</td>
                    <td className="px-5 py-4 text-right">
                      {p.status === "Paid" ? (
                        <span className="text-xs text-muted-foreground">Paid</span>
                      ) : (
                        <button
                          onClick={() => markPaid(p)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
