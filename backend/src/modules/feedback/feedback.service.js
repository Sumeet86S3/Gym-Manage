import { listFeedback as listWorkoutFeedback } from "../workouts/workouts.service.js";

export async function list(user, query = {}) {
  return listWorkoutFeedback(user, query.filter ?? "All");
}
