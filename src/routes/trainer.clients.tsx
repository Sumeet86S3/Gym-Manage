import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { mockClients, type Client } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/trainer/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", goal: "" });

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const addClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: form.name,
      email: form.email,
      goal: form.goal || "General fitness",
      status: "Active",
      lastVisit: "Today",
      joinedAt: new Date().toISOString().slice(0, 10),
      streak: 0,
      plan: "Standard Monthly",
      paymentStatus: "Paid",
      dueDate: "—",
    };
    setClients((prev) => [newClient, ...prev]);
    setForm({ name: "", email: "", goal: "" });
    setOpen(false);
    toast.success("Client added.");
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Everyone you train — one organized list."
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add client
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Goal</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last visit</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.goal}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={c.status === "Active" ? "success" : "muted"}>{c.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.lastVisit}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="View"><Eye className="h-4 w-4" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button
                        onClick={() => {
                          setClients((prev) => prev.filter((p) => p.id !== c.id));
                          toast.success("Client removed.");
                        }}
                        className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new client</DialogTitle>
            <DialogDescription>Fill in the basics — you can edit details later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addClient} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary goal</label>
              <input
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="e.g. Weight loss"
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
                Add client
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
