import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Filter, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MealTypeBadge } from "@/components/meal/meal-type-badge";
import type { Client, MealEntry, MealType } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApiResource } from "@/hooks/use-api-resource";

export const Route = createFileRoute("/trainer/meals")({
  component: TrainerMealsPage,
});

type RangeFilter = "today" | "week" | "all";
type TypeFilter = MealType | "all";

function TrainerMealsPage() {
  const [type, setType] = useState<TypeFilter>("all");
  const [range, setRange] = useState<RangeFilter>("today");
  const [selectedClientId, setSelectedClientId] = useState("all");
  const query = useMemo(() => {
    const params = new URLSearchParams({ type, range });
    if (selectedClientId !== "all") params.set("clientId", selectedClientId);
    return `/meals?${params.toString()}`;
  }, [range, selectedClientId, type]);
  const { data: clients, loading: clientsLoading } = useApiResource<Client[]>("/clients", []);
  const { data: meals } = useApiResource<
    Array<MealEntry & { imageUrl?: string; loggedAt?: string }>
  >(query, []);

  const normalized = useMemo(
    () =>
      meals.map((meal) => ({
        ...meal,
        image: meal.image ?? meal.imageUrl ?? "",
        timestamp:
          meal.timestamp ?? (meal.loggedAt ? new Date(meal.loggedAt).getTime() : Date.now()),
        time:
          meal.time ??
          (meal.loggedAt
            ? new Date(meal.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            : "Now"),
      })),
    [meals],
  );

  const typeChips: TypeFilter[] = [
    "all",
    "Warm water",
    "Breakfast",
    "Lunch",
    "Evening Snack",
    "Dinner",
    "Pre-Workout",
    "Post-Workout",
  ];
  const stats = {
    total: normalized.length,
    clients: new Set(normalized.map((m) => m.clientId)).size,
    week: normalized.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Updates" description="Live feed of client meal uploads." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MiniStat label="Meals in view" value={stats.total} accent="from-primary to-primary-glow" />
        <MiniStat
          label="Active clients"
          value={stats.clients}
          accent="from-emerald-500 to-emerald-400"
        />
        <MiniStat
          label="Filtered entries"
          value={stats.week}
          accent="from-orange-500 to-amber-400"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-card md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {typeChips.map((c) => (
              <button
                key={c}
                onClick={() => setType(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
                  type === c
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {c === "all" ? <Filter className="h-3.5 w-3.5" /> : null}
                {c === "all" ? "All meals" : c}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={clientsLoading}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-56">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {normalized.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UtensilsCrossed className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">No meal uploads match</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try another filter or time range.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {normalized.map((m) => (
            <FeedCard key={m.id} meal={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent",
          accent,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FeedCard({ meal }: { meal: MealEntry }) {
  const initials = meal.clientName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-xs font-semibold text-primary-foreground shadow-soft">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{meal.clientName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {meal.time}
          </p>
        </div>
        <MealTypeBadge type={meal.type} />
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={meal.image}
          alt={`${meal.clientName} - ${meal.type}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      {meal.note && <p className="px-4 py-3 text-sm text-foreground">{meal.note}</p>}
    </article>
  );
}
