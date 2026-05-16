import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/client/payments")({
  component: ClientPayments,
});

const history = [
  { id: "1", plan: "Premium Quarterly", amount: 19999, date: "Jan 10, 2025", status: "Paid" as const, due: "—" },
  { id: "2", plan: "Premium Quarterly", amount: 19999, date: "Apr 10, 2025", status: "Paid" as const, due: "—" },
  { id: "3", plan: "Premium Quarterly", amount: 19999, date: "Jul 10, 2025", status: "Due" as const, due: "Jul 10, 2025" },
];

function ClientPayments() {
  return (
    <div>
      <PageHeader title="Payments" description="Your plan, billing history and upcoming payments." />

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active plan</p>
            <h2 className="mt-1 text-2xl font-semibold">Premium Quarterly</h2>
            <p className="mt-1 text-sm text-muted-foreground">Renews on Jul 10, 2025</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold">₹19,999<span className="text-sm font-medium text-muted-foreground">/quarter</span></p>
            <StatusBadge tone="success" className="mt-2">Active</StatusBadge>
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
                  <td className="px-5 py-4 text-muted-foreground">{p.date}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={p.status === "Paid" ? "success" : "warning"}>{p.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{p.due}</td>
                  <td className="px-5 py-4 text-right font-semibold">₹{p.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
