import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Filter,
  LoaderCircle,
  RefreshCw,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { MealTypeBadge } from "@/components/meal/meal-type-badge";
import type { Client, MealEntry, MealType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useApiResource } from "@/hooks/use-api-resource";
import { api, formatDateLabel } from "@/lib/api";

export const Route = createFileRoute("/trainer/meals")({
  component: TrainerMealsPage,
});

type RangeFilter = "today" | "week" | "date" | "all";
type TypeFilter = MealType | "all";
type ApiMealEntry = MealEntry & { imageUrl?: string; loggedAt?: string };
type MealPage = {
  items: ApiMealEntry[];
  page: number;
  nextPage: number | null;
  hasMore: boolean;
};
type MissedMealSummary = {
  totalMissed: number;
  clients: Array<{
    clientId: string;
    clientName: string;
    missedCount: number;
    lastMissedDate: string | null;
  }>;
};

const MEAL_PAGE_SIZE = 12;

function TrainerMealsPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TypeFilter>("all");
  const [range, setRange] = useState<RangeFilter>("today");
  const [selectedDate, setSelectedDate] = useState(todayInputValue);
  const [selectedClientId, setSelectedClientId] = useState("all");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingMeals, setClearingMeals] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ type, range });
    if (selectedClientId !== "all") params.set("clientId", selectedClientId);
    if (range === "date" && selectedDate) params.set("date", selectedDate);
    return params;
  }, [range, selectedClientId, selectedDate, type]);
  const { data: clients, loading: clientsLoading } = useApiResource<Client[]>("/clients", []);
  const { data: missedMeals } = useApiResource<MissedMealSummary>("/meals/missed", {
    totalMissed: 0,
    clients: [],
  });
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["api", "/meals", queryParams.toString(), MEAL_PAGE_SIZE],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams(queryParams);
      params.set("limit", String(MEAL_PAGE_SIZE));
      params.set("page", String(pageParam));
      return api<MealPage>(`/meals?${params.toString()}`, { signal });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "360px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const normalized = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.items) ?? []).map((meal) => ({
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
    [data],
  );
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const clearSelectedClientMeals = async () => {
    if (!selectedClient) return;
    setClearingMeals(true);
    try {
      const result = await api<{
        clientName: string;
        deletedMealUpdates: number;
      }>("/meals/clear", {
        method: "DELETE",
        body: JSON.stringify({ clientId: selectedClient.id }),
      });
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["api", "/meals/missed"] }),
      ]);
      toast.success("Meal history cleared.", {
        description: `${result.deletedMealUpdates} meal update${
          result.deletedMealUpdates === 1 ? "" : "s"
        } removed for ${result.clientName}.`,
      });
      setClearDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to clear meal history.");
    } finally {
      setClearingMeals(false);
    }
  };

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
    missed: missedMeals.totalMissed,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Updates" description="Live feed of client meal uploads." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <MiniStat
          label="Missed updates"
          value={stats.missed}
          accent="from-destructive to-orange-500"
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
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
                <SelectItem value="date">Select date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            {range === "date" ? (
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Meal upload date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-10 rounded-xl pl-9 sm:w-40"
                />
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={!selectedClient || clearingMeals}
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Clear selected
            </Button>
          </div>
        </div>
      </div>

      {missedMeals.totalMissed > 0 ? <MissedMealPanel summary={missedMeals} /> : null}

      {isLoading ? (
        <MealFeedSkeleton />
      ) : isError ? (
        <MealFeedError error={error} onRetry={() => refetch()} />
      ) : normalized.length === 0 ? (
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

      {!isLoading && !isError && normalized.length > 0 ? (
        <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center">
          {isFetchingNextPage ? (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading more meals...
            </p>
          ) : hasNextPage ? (
            <Button variant="outline" onClick={() => fetchNextPage()}>
              Load more
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">You have reached the end.</p>
          )}
        </div>
      ) : null}

      <AlertDialog
        open={clearDialogOpen}
        onOpenChange={(next) => {
          if (!next && !clearingMeals) setClearDialogOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear meal history?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all meal updates for{" "}
              {selectedClient?.name ?? "the selected client"} through today and clears their missed
              meal updates through today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingMeals}>Cancel</AlertDialogCancel>
            <button
              type="button"
              onClick={clearSelectedClientMeals}
              disabled={clearingMeals || !selectedClient}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {clearingMeals ? "Clearing..." : "Clear history"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function MissedMealPanel({ summary }: { summary: MissedMealSummary }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 shadow-card">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Missed meal updates</p>
          <p className="text-sm text-muted-foreground">
            Missing meal types on completed days, counted through yesterday.
          </p>
        </div>
        <p className="text-sm font-semibold text-destructive">
          {summary.totalMissed} {summary.totalMissed === 1 ? "missed update" : "missed updates"}
        </p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {summary.clients.slice(0, 3).map((client) => (
          <div
            key={client.clientId}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{client.clientName}</p>
              <p className="text-xs text-muted-foreground">
                Last missed {formatDateLabel(client.lastMissedDate)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
              {client.missedCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <article
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          <div className="flex items-center gap-3 p-3.5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </article>
      ))}
    </div>
  );
}

function MealFeedError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof Error ? error.message : "Unable to load meal updates.";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">Meal updates did not load</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
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

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
