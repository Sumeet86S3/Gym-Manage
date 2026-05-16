// Centralized mock data for the entire app

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
  lastVisit: string;
  joinedAt: string;
  streak: number;
  plan: string;
  paymentStatus: "Paid" | "Due" | "Overdue";
  dueDate: string;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
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
  workoutName: string;
  date: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  energy: "Low" | "Normal" | "High";
  issue: "No issue" | "Joint pain" | "Muscle soreness" | "Other";
  notes: string;
}

export const mockTrainers: Trainer[] = [
  { id: "t1", name: "Alex Rivera", email: "alex@fitstudio.com", status: "Approved", joinedAt: "2024-08-12", clients: 14 },
  { id: "t2", name: "Priya Shah", email: "priya@fitstudio.com", status: "Approved", joinedAt: "2024-09-04", clients: 9 },
  { id: "t3", name: "Marcus Lee", email: "marcus@fitstudio.com", status: "Pending", joinedAt: "2025-04-18", clients: 0 },
  { id: "t4", name: "Elena Costa", email: "elena@fitstudio.com", status: "Pending", joinedAt: "2025-04-21", clients: 0 },
  { id: "t5", name: "Jordan Kim", email: "jordan@fitstudio.com", status: "Rejected", joinedAt: "2025-03-30", clients: 0 },
  { id: "t6", name: "Sam Patel", email: "sam@fitstudio.com", status: "Approved", joinedAt: "2024-11-01", clients: 22 },
];

export const mockClients: Client[] = [
  { id: "c1", name: "Olivia Bennett", email: "olivia@example.com", goal: "Weight loss", status: "Active", lastVisit: "Today", joinedAt: "2024-12-10", streak: 5, plan: "Premium Quarterly", paymentStatus: "Paid", dueDate: "2025-07-10" },
  { id: "c2", name: "Liam Carter", email: "liam@example.com", goal: "Muscle gain", status: "Active", lastVisit: "Yesterday", joinedAt: "2025-01-22", streak: 12, plan: "Standard Monthly", paymentStatus: "Due", dueDate: "2025-04-28" },
  { id: "c3", name: "Sophia Nguyen", email: "sophia@example.com", goal: "Endurance", status: "Active", lastVisit: "2 days ago", joinedAt: "2024-10-05", streak: 3, plan: "Premium Monthly", paymentStatus: "Paid", dueDate: "2025-05-05" },
  { id: "c4", name: "Noah Williams", email: "noah@example.com", goal: "Strength", status: "Inactive", lastVisit: "9 days ago", joinedAt: "2024-07-19", streak: 0, plan: "Standard Monthly", paymentStatus: "Overdue", dueDate: "2025-04-12" },
  { id: "c5", name: "Ava Rodríguez", email: "ava@example.com", goal: "Flexibility", status: "Active", lastVisit: "Today", joinedAt: "2025-02-14", streak: 8, plan: "Premium Quarterly", paymentStatus: "Paid", dueDate: "2025-08-14" },
  { id: "c6", name: "Ethan Brooks", email: "ethan@example.com", goal: "Weight loss", status: "Active", lastVisit: "3 days ago", joinedAt: "2024-09-30", streak: 2, plan: "Standard Monthly", paymentStatus: "Due", dueDate: "2025-04-30" },
  { id: "c7", name: "Mia Thompson", email: "mia@example.com", goal: "Muscle gain", status: "Inactive", lastVisit: "14 days ago", joinedAt: "2024-06-11", streak: 0, plan: "Standard Monthly", paymentStatus: "Overdue", dueDate: "2025-04-08" },
];

export const mockWorkout: Workout = {
  id: "w1",
  name: "Upper Body Strength",
  type: "Strength",
  exercises: [
    { id: "e1", name: "Barbell Bench Press", type: "Compound", equipment: "Barbell", sets: 4, reps: 8, weight: 60 },
    { id: "e2", name: "Pull-ups", type: "Compound", equipment: "Bodyweight", sets: 4, reps: 10, weight: 0 },
    { id: "e3", name: "Dumbbell Shoulder Press", type: "Compound", equipment: "Dumbbells", sets: 3, reps: 12, weight: 18 },
    { id: "e4", name: "Barbell Row", type: "Compound", equipment: "Barbell", sets: 4, reps: 10, weight: 50 },
    { id: "e5", name: "Tricep Rope Pushdown", type: "Isolation", equipment: "Cable", sets: 3, reps: 15, weight: 25 },
    { id: "e6", name: "Bicep Curl", type: "Isolation", equipment: "Dumbbells", sets: 3, reps: 12, weight: 14 },
  ],
};

export const exerciseLibrary: Exercise[] = [
  { id: "lib1", name: "Squat", type: "Compound", equipment: "Barbell", sets: 4, reps: 8, weight: 80 },
  { id: "lib2", name: "Deadlift", type: "Compound", equipment: "Barbell", sets: 3, reps: 5, weight: 100 },
  { id: "lib3", name: "Lunges", type: "Compound", equipment: "Dumbbells", sets: 3, reps: 12, weight: 16 },
  { id: "lib4", name: "Plank", type: "Core", equipment: "Bodyweight", sets: 3, reps: 60, weight: 0 },
  { id: "lib5", name: "Russian Twist", type: "Core", equipment: "Medicine Ball", sets: 3, reps: 20, weight: 6 },
  { id: "lib6", name: "Treadmill Run", type: "Cardio", equipment: "Treadmill", sets: 1, reps: 30, weight: 0 },
];

export const mockFeedback: FeedbackEntry[] = [
  { id: "f1", clientName: "Olivia Bennett", clientId: "c1", workoutName: "Upper Body Strength", date: "Today, 9:14 AM", difficulty: "Hard", energy: "Low", issue: "Joint pain", notes: "Right shoulder felt tight during bench press." },
  { id: "f2", clientName: "Liam Carter", clientId: "c2", workoutName: "Lower Body Power", date: "Today, 8:02 AM", difficulty: "Moderate", energy: "Normal", issue: "No issue", notes: "Felt good, ready to increase weight next session." },
  { id: "f3", clientName: "Sophia Nguyen", clientId: "c3", workoutName: "HIIT Cardio", date: "Today, 7:30 AM", difficulty: "Hard", energy: "Low", issue: "Muscle soreness", notes: "Hamstrings still sore from Monday." },
  { id: "f4", clientName: "Ava Rodríguez", clientId: "c5", workoutName: "Mobility & Core", date: "Yesterday", difficulty: "Easy", energy: "High", issue: "No issue", notes: "" },
  { id: "f5", clientName: "Ethan Brooks", clientId: "c6", workoutName: "Full Body Circuit", date: "Yesterday", difficulty: "Moderate", energy: "Normal", issue: "Other", notes: "Slight headache toward end." },
];

export const attendanceTrend = [
  { day: "Mon", visits: 24 },
  { day: "Tue", visits: 32 },
  { day: "Wed", visits: 28 },
  { day: "Thu", visits: 36 },
  { day: "Fri", visits: 41 },
  { day: "Sat", visits: 38 },
  { day: "Sun", visits: 19 },
];

export const revenueTrend = [
  { month: "Nov", revenue: 672000 },
  { month: "Dec", revenue: 736000 },
  { month: "Jan", revenue: 808000 },
  { month: "Feb", revenue: 912000 },
  { month: "Mar", revenue: 1024000 },
  { month: "Apr", revenue: 1115800 },
];

export const weightProgress = [
  { week: "W1", weight: 82.4 },
  { week: "W2", weight: 81.8 },
  { week: "W3", weight: 81.1 },
  { week: "W4", weight: 80.5 },
  { week: "W5", weight: 79.9 },
  { week: "W6", weight: 79.2 },
  { week: "W7", weight: 78.6 },
  { week: "W8", weight: 78.0 },
];

export const measurementProgress = [
  { week: "W1", chest: 102, waist: 92, arms: 36 },
  { week: "W2", chest: 102, waist: 91, arms: 36 },
  { week: "W3", chest: 103, waist: 90, arms: 36.5 },
  { week: "W4", chest: 103, waist: 89, arms: 37 },
  { week: "W5", chest: 104, waist: 88, arms: 37 },
  { week: "W6", chest: 104, waist: 87, arms: 37.5 },
];

export const recentPayments = [
  { id: "p1", client: "Olivia Bennett", amount: 19999, plan: "Premium Quarterly", date: "Apr 24", status: "Paid" as const },
  { id: "p2", client: "Liam Carter", amount: 7499, plan: "Standard Monthly", date: "Apr 23", status: "Due" as const },
  { id: "p3", client: "Sophia Nguyen", amount: 9999, plan: "Premium Monthly", date: "Apr 22", status: "Paid" as const },
  { id: "p4", client: "Noah Williams", amount: 7499, plan: "Standard Monthly", date: "Apr 12", status: "Overdue" as const },
];

export const clientGoals = [
  { id: "g1", title: "Lose 8 kg", start: 86, current: 78, target: 78, unit: "kg", reverse: true },
  { id: "g2", title: "Bench press 80kg", start: 50, current: 65, target: 80, unit: "kg", reverse: false },
  { id: "g3", title: "Run 5km under 25min", start: 32, current: 27, target: 25, unit: "min", reverse: true },
];

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

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

export const mockMeals: MealEntry[] = [
  {
    id: "m1", clientId: "c1", clientName: "Olivia Bennett", type: "Breakfast",
    time: "8:32 AM", timestamp: Date.now() - 1000 * 60 * 60 * 2,
    note: "Oats with berries + 3 egg whites",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=70",
  },
  {
    id: "m2", clientId: "c2", clientName: "Liam Carter", type: "Lunch",
    time: "1:15 PM", timestamp: Date.now() - 1000 * 60 * 60 * 1,
    note: "Grilled chicken bowl, brown rice, avocado",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=70",
  },
  {
    id: "m3", clientId: "c3", clientName: "Sophia Nguyen", type: "Snacks",
    time: "4:40 PM", timestamp: Date.now() - 1000 * 60 * 30,
    note: "Greek yogurt, almonds, honey",
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&auto=format&fit=crop&q=70",
  },
  {
    id: "m4", clientId: "c5", clientName: "Ava Rodríguez", type: "Dinner",
    time: "Yesterday, 8:10 PM", timestamp: Date.now() - 1000 * 60 * 60 * 18,
    note: "Salmon, quinoa, steamed broccoli",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=70",
  },
  {
    id: "m5", clientId: "c6", clientName: "Ethan Brooks", type: "Breakfast",
    time: "Yesterday, 7:50 AM", timestamp: Date.now() - 1000 * 60 * 60 * 28,
    note: "Protein smoothie + banana",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=800&auto=format&fit=crop&q=70",
  },
  {
    id: "m6", clientId: "c1", clientName: "Olivia Bennett", type: "Lunch",
    time: "Yesterday, 1:25 PM", timestamp: Date.now() - 1000 * 60 * 60 * 24,
    note: "Tofu stir-fry with veggies",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=70",
  },
];

export const notifications = [
  { id: "n1", type: "payment" as const, title: "Payment due reminder", desc: "Liam Carter — due in 3 days", time: "2h ago" },
  { id: "n2", type: "missed" as const, title: "Missed workout alert", desc: "Noah Williams missed scheduled session", time: "5h ago" },
  { id: "n3", type: "feedback" as const, title: "New feedback submitted", desc: "Olivia reported joint pain", time: "1d ago" },
];
