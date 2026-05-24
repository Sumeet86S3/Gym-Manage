import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import type { Client } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useApiResource } from "@/hooks/use-api-resource";
import { formatDateLabel, toCurrency } from "@/lib/api";

export const Route = createFileRoute("/trainer/clients")({
  component: ClientsPage,
});

interface ClientCreateResponse {
  client: Client;
  credentials: {
    email: string;
    password: string;
  };
}

function ClientsPage() {
  const { data: clients, setData: setClients } = useApiResource<Client[]>("/clients", []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<ClientCreateResponse["credentials"] | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    goal: "",
    monthlyFee: "",
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    goal: "",
    monthlyFee: "",
    admissionDate: new Date().toISOString().slice(0, 10),
  });

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await api<ClientCreateResponse>("/clients", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        monthlyFee: Number(form.monthlyFee),
      }),
    });
    setClients((prev) => [result.client, ...prev]);
    setCredentials(result.credentials);
    setCopied(false);
    setForm({
      name: "",
      email: "",
      goal: "",
      monthlyFee: "",
      admissionDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    toast.success("Client added.");
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied.");
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setEditForm({
      name: client.name,
      email: client.email,
      goal: client.goal,
      monthlyFee: String(client.monthlyFee ?? 0),
    });
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const updated = await api<Client>(`/clients/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...editForm,
          monthlyFee: Number(editForm.monthlyFee),
        }),
      });
      setClients((prev) => prev.map((client) => (client.id === updated.id ? updated : client)));
      setEditing(null);
      toast.success("Client profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update client.");
    }
  };

  const deleteClient = async () => {
    if (!clientToDelete) return;
    setDeletingClient(true);
    try {
      await api(`/clients/${clientToDelete.id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((client) => client.id !== clientToDelete.id));
      toast.success("Client removed.");
      setClientToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove client.");
    } finally {
      setDeletingClient(false);
    }
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
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Fees</th>
                <th className="px-5 py-3 font-medium">Next due</th>
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
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{c.goal}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      tone={
                        c.paymentStatus === "Paid"
                          ? "success"
                          : c.paymentStatus === "Due Soon"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {c.paymentStatus}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {toCurrency(c.monthlyFee ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDateLabel(c.dueDate)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{c.lastVisit}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(c)}
                        className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${c.name}`}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Monthly fee</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.monthlyFee}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                  placeholder="e.g. 2500"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Admission date</label>
                <input
                  required
                  type="date"
                  value={form.admissionDate}
                  onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
              >
                Add client
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(clientToDelete)}
        onOpenChange={(next) => {
          if (!next && !deletingClient) setClientToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {clientToDelete?.name ?? "this client"} from your active client list.
              Their related records stay preserved in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingClient}>Cancel</AlertDialogCancel>
            <button
              type="button"
              onClick={deleteClient}
              disabled={deletingClient}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {deletingClient ? "Deleting..." : "Delete client"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit client profile</DialogTitle>
            <DialogDescription>
              Update the details shown across trainer and client dashboards.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveClient} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary goal</label>
              <input
                value={editForm.goal}
                onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly fee</label>
              <input
                required
                type="number"
                min="0"
                value={editForm.monthlyFee}
                onChange={(e) => setEditForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
              >
                Save changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(credentials)} onOpenChange={(next) => !next && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client login credentials</DialogTitle>
            <DialogDescription>
              Share these with the client now. The password is shown only once.
            </DialogDescription>
          </DialogHeader>
          {credentials ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1 break-all font-semibold">{credentials.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Password
                    </p>
                    <p className="mt-1 font-mono text-base font-semibold">{credentials.password}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setCredentials(null)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy credentials"}
                </button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
