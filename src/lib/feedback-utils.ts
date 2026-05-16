import type { FeedbackEntry } from "./mock-data";

export function feedbackTone(f: FeedbackEntry): "destructive" | "warning" | "success" {
  if (f.issue !== "No issue") return "destructive";
  if (f.difficulty === "Hard" && f.energy === "Low") return "warning";
  return "success";
}
