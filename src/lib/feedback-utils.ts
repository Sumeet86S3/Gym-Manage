import type { FeedbackEntry } from "./types";

export function feedbackTone(f: FeedbackEntry): "destructive" | "warning" | "success" {
  if (f.issue !== "No issue") return "destructive";
  if (f.difficulty === "Hard" && f.energy === "Low") return "warning";
  return "success";
}
