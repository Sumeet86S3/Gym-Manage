import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import type { Trainer } from "@/lib/types";
import { useApiResource } from "@/hooks/use-api-resource";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/trainers")({
  component: TrainersPage,
});

function TrainersPage() {
  const { data: trainers, setData: setTrainers } = useApiResource<Trainer[]>("/trainers", []);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState(false);
  const approved = trainers.filter((t) => t.status === "Approved");

  const deleteTrainer = async () => {
    if (!trainerToDelete) return;
    setDeletingTrainer(true);
    try {
      await api(`/trainers/${trainerToDelete.id}`, { method: "DELETE" });
      setTrainers((prev) => prev.filter((trainer) => trainer.id !== trainerToDelete.id));
      toast.success("Trainer deleted.");
      setTrainerToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete trainer.");
    } finally {
      setDeletingTrainer(false);
    }
  };

  return (
    <div>
      <PageHeader title="Trainers" description="All approved trainers in your studio." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {approved.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Clients</p>
                <p className="text-lg font-semibold">{t.clients}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">{t.joinedAt}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge tone="success">{t.status}</StatusBadge>
              <button
                onClick={() => setTrainerToDelete(t)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={Boolean(trainerToDelete)}
        onOpenChange={(next) => {
          if (!next && !deletingTrainer) setTrainerToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trainer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {trainerToDelete?.name ?? "this trainer"}, their clients,
              workouts, payments, goals, feedback, measurements, attendance, meals, and active
              sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTrainer}>Cancel</AlertDialogCancel>
            <button
              type="button"
              onClick={deleteTrainer}
              disabled={deletingTrainer}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {deletingTrainer ? "Deleting..." : "Delete trainer"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
