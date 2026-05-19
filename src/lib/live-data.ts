import type { Client, FeedbackEntry, MealEntry, Workout } from "./types";

export interface TrainerRecord {
  id: string;
  name: string;
  email: string;
  status: "Pending" | "Approved" | "Rejected";
  joinedAt: string;
  clients: number;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName?: string;
  client?: string;
  amount: number;
  plan: string;
  status: "Paid" | "Due" | "Overdue";
  paidAt?: string | null;
  dueDate?: string | null;
  createdAt?: string;
}

export interface MeasurementRecord {
  id: string;
  clientId: string;
  weight?: number;
  height?: number;
  chest?: number;
  waist?: number;
  arms?: number;
  leftBicep?: number;
  rightBicep?: number;
  leftForearm?: number;
  rightForearm?: number;
  upperBelly?: number;
  lowerBelly?: number;
  hip?: number;
  thigh?: number;
  leftThigh?: number;
  rightThigh?: number;
  calf?: number;
  leftCalf?: number;
  rightCalf?: number;
  measuredAt: string;
}

export interface GoalRecord {
  id: string;
  clientId: string;
  title: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  reverse: boolean;
}

export type { Client, FeedbackEntry, MealEntry, Workout };

export const emptyTrend = [
  { day: "Mon", visits: 0 },
  { day: "Tue", visits: 0 },
  { day: "Wed", visits: 0 },
  { day: "Thu", visits: 0 },
  { day: "Fri", visits: 0 },
  { day: "Sat", visits: 0 },
  { day: "Sun", visits: 0 },
];

export function measurementsByWeek(rows: MeasurementRecord[]) {
  return rows.map((row, index) => ({
    week: `W${index + 1}`,
    weight: row.weight,
    chest: row.chest,
    waist: row.waist,
    arms: row.arms,
    upperBelly: row.upperBelly,
    lowerBelly: row.lowerBelly,
    hip: row.hip,
    thigh: row.thigh,
    calf: row.calf,
  }));
}

export function paymentTrend(payments: PaymentRecord[]) {
  const paid = payments.filter((payment) => payment.status === "Paid");
  if (!paid.length) return [{ month: "Now", revenue: 0 }];
  const grouped = new Map<string, number>();
  paid.forEach((payment) => {
    const source = payment.paidAt ?? payment.createdAt ?? new Date().toISOString();
    const month = new Date(source).toLocaleDateString("en-US", { month: "short" });
    grouped.set(month, (grouped.get(month) ?? 0) + payment.amount);
  });
  return Array.from(grouped.entries()).map(([month, revenue]) => ({ month, revenue }));
}
