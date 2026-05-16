import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Clock, Filter, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { MealTypeBadge } from "@/components/meal/meal-type-badge";
import { mockMeals, type MealType } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer/meals")({
  component: TrainerMealsPage,
});

type RangeFilter = "today" | "week" | "all";
type TypeFilter = MealType | "all";

const DAY_MS = 1000 * 60 * 60 * 24;

function TrainerMealsPage() {
  const [type, setType] = useState<TypeFilter>("all");
  const [range, setRange] = useState<RangeFilter>("today");
  const [search, setSearch] = useState("");

  const clients = useMemo(
    () => Array.from(new Set(mockMeals.map((m) => m.clientName))),
    [],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return mockMeals.filter((m) => {
      if (type !== "all" && m.type !== type) return false;
      if (range === "today" && now - m.timestamp > DAY_MS) return false;
      if (range === "week" && now - m.timestamp > DAY_MS * 7) return false;
      if (search && !m.clientName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [type, range, search]);

  const typeChips: TypeFilter[] = ["all", "Breakfast", "Lunch", "Dinner", "Snacks"];

  const stats = useMemo(() => {
    const today = mockMeals.filter((m) => Date.now() - m.timestamp <= DAY_MS);
    return {
      total: today.length,
      clients: new Set(today.map((m) => m.clientId)).size,
      week: mockMeals.filter((m) => Date.now() - m.timestamp <= DAY_MS * 7).length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Updates"
        description="Live feed of client meal uploads — keep nutrition consistent and on plan."
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MiniStat label="Meals logged today" value={stats.total} accent="from-primary to-primary-glow" />
        <MiniStat label="Active clients today" value={stats.clients} accent="from-emerald-500 to-emerald-400" />
        <MiniStat label="Last 7 days" value={stats.week} accent="from-orange-500 to-amber-400" />
      </div>

      {/* Filters */}
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client…"
                list="meal-clients"
                className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
              />
              <datalist id="meal-clients">
                {clients.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
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

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UtensilsCrossed className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">No meal uploads match</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try a different meal type, time range, or clear the search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
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

function FeedCard({ meal }: { meal: (typeof mockMeals)[number] }) {
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
      {meal.note && (
        <p className="px-4 py-3 text-sm text-foreground">
          <span className="text-muted-foreground">“</span>
          {meal.note}
          <span className="text-muted-foreground">”</span>
        </p>
      )}
    </article>
  );
}
