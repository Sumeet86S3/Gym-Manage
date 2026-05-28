export type UserRole = "admin" | "trainer" | "client";

export interface Trainer {
  id: string;
  name: string;
  email: string;
  status: "Pending" | "Approved" | "Rejected";
  joinedAt: string;
  clients: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  goal: string;
  status: "Active" | "Inactive";
  lastVisit?: string | null;
  joinedAt: string;
  streak: number;
  plan: string;
  monthlyFee?: number;
  paymentStatus: "Paid" | "Due Soon" | "Unpaid";
  dueDate?: string | null;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  durationMinutes?: number;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  type: string;
  equipment: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface FeedbackEntry {
  id: string;
  clientName: string;
  clientId: string;
  workoutName?: string;
  date?: string;
  createdAt?: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  energy: "Low" | "Normal" | "High";
  issue: "No issue" | "Joint pain" | "Muscle soreness" | "Other";
  notes?: string;
}

export type MealType =
  | "Warm water"
  | "Breakfast"
  | "Lunch"
  | "Evening Snack"
  | "Dinner"
  | "Pre-Workout"
  | "Post-Workout";

export interface MealEntry {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  type: MealType;
  time: string;
  timestamp: number;
  note?: string;
  image: string;
}
