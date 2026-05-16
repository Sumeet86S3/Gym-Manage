import { Coffee, Salad, Soup, Cookie } from "lucide-react";
import type { MealType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const config: Record<MealType, { icon: typeof Coffee; cls: string; dot: string }> = {
  Breakfast: { icon: Coffee, cls: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25", dot: "bg-orange-500" },
  Lunch: { icon: Salad, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500" },
  Dinner: { icon: Soup, cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25", dot: "bg-blue-500" },
  Snacks: { icon: Cookie, cls: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25", dot: "bg-purple-500" },
};

export function MealTypeBadge({ type, size = "sm" }: { type: MealType; size?: "sm" | "md" }) {
  const { icon: Icon, cls } = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        cls,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {type}
    </span>
  );
}

export const mealTypeIcon = (t: MealType) => config[t].icon;
export const mealTypeDot = (t: MealType) => config[t].dot;
