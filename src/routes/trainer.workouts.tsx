import { createFileRoute } from "@tanstack/react-router";
import { Plus, Dumbbell } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useApiResource } from "@/hooks/use-api-resource";
import type { Workout } from "@/lib/live-data";

export const Route = createFileRoute("/trainer/workouts")({
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const { data: workouts } = useApiResource<Workout[]>("/workouts", []);
  const workout = workouts[0];
  const exerciseLibrary = workouts.flatMap((w) => w.exercises ?? []).slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Workout plans"
        description="Build, assign and reuse workout templates."
        action={
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New workout
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            {workout ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {workout.type}
                    </p>
                    <h3 className="text-lg font-semibold">{workout.name}</h3>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {workout.exercises.length} exercises
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="py-2 font-medium">Exercise</th>
                        <th className="py-2 font-medium">Equipment</th>
                        <th className="py-2 font-medium">Sets</th>
                        <th className="py-2 font-medium">Reps</th>
                        <th className="py-2 font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {workout.exercises.map((e) => (
                        <tr key={e.id}>
                          <td className="py-3">
                            <p className="font-medium">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.type}</p>
                          </td>
                          <td className="py-3 text-muted-foreground">{e.equipment}</td>
                          <td className="py-3">{e.sets}</td>
                          <td className="py-3">{e.reps}</td>
                          <td className="py-3">{e.weight > 0 ? `${e.weight} kg` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No workouts created yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Exercise library</h3>
          </div>
          <ul className="space-y-2">
            {exerciseLibrary.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.type} - {e.equipment}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
