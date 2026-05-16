import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { mockClients } from "@/lib/mock-data";

export const Route = createFileRoute("/trainer/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockClients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.plan}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={c.paymentStatus === "Paid" ? "success" : c.paymentStatus === "Due" ? "warning" : "destructive"}>
                      {c.paymentStatus}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.dueDate}</td>
                  <td className="px-5 py-4 text-right font-semibold">₹{c.plan.includes("Premium") ? "9,999" : "7,499"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
