import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["admin", "trainer", "client"] }).notNull(),
    approvalStatus: text("approval_status", { enum: ["Pending", "Approved", "Rejected"] })
      .notNull()
      .default("Approved"),
    tokenVersion: integer("token_version").notNull().default(0),
    lastLoginAt: text("last_login_at"),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
  }),
);

export const trainers = sqliteTable(
  "trainers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    specialization: text("specialization"),
    status: text("status", { enum: ["Pending", "Approved", "Rejected"] })
      .notNull()
      .default("Pending"),
    joinedAt: text("joined_at").notNull(),
    gymName: text("gym_name").notNull().default("FitSphere Elite Studio"),
    gymAddress: text("gym_address").notNull().default("Indiranagar Performance Hub"),
    gymLatitude: real("gym_latitude").notNull().default(12.9719),
    gymLongitude: real("gym_longitude").notNull().default(77.6412),
    attendanceRadiusMeters: integer("attendance_radius_meters").notNull().default(100),
    gymLocationConfigured: integer("gym_location_configured", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => ({
    userIdx: uniqueIndex("trainers_user_id_idx").on(table.userId),
    statusIdx: index("trainers_status_idx").on(table.status),
  }),
);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    trainerId: text("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    goal: text("goal").notNull().default("General fitness"),
    status: text("status", { enum: ["Active", "Inactive"] })
      .notNull()
      .default("Active"),
    lastVisit: text("last_visit"),
    joinedAt: text("joined_at").notNull(),
    streak: integer("streak").notNull().default(0),
    plan: text("plan").notNull().default("Standard Monthly"),
    monthlyFee: integer("monthly_fee").notNull().default(0),
    paymentStatus: text("payment_status", { enum: ["Paid", "Due Soon", "Unpaid"] })
      .notNull()
      .default("Paid"),
    dueDate: text("due_date"),
    ...timestamps,
  },
  (table) => ({
    emailIdx: index("clients_email_idx").on(table.email),
    trainerIdx: index("clients_trainer_id_idx").on(table.trainerId),
  }),
);

export const workouts = sqliteTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    trainerId: text("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(45),
    ...timestamps,
  },
  (table) => ({
    trainerIdx: index("workouts_trainer_id_idx").on(table.trainerId),
    clientIdx: index("workouts_client_id_idx").on(table.clientId),
  }),
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id").references(() => workouts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    equipment: text("equipment").notNull(),
    sets: integer("sets").notNull().default(1),
    reps: integer("reps").notNull().default(1),
    weight: real("weight").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    workoutIdx: index("exercises_workout_id_idx").on(table.workoutId),
  }),
);

export const mealLogs = sqliteTable(
  "meal_logs",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "Warm water",
        "Breakfast",
        "Lunch",
        "Evening Snack",
        "Dinner",
        "Pre-Workout",
        "Post-Workout",
      ],
    }).notNull(),
    note: text("note"),
    imageUrl: text("image_url").notNull(),
    imagekitFileId: text("imagekit_file_id"),
    loggedAt: text("logged_at").notNull(),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("meal_logs_client_id_idx").on(table.clientId),
    loggedAtIdx: index("meal_logs_logged_at_idx").on(table.loggedAt),
  }),
);

export const mealClearances = sqliteTable(
  "meal_clearances",
  {
    clientId: text("client_id")
      .primaryKey()
      .references(() => clients.id, { onDelete: "cascade" }),
    clearedThrough: text("cleared_through").notNull(),
    ...timestamps,
  },
  (table) => ({
    clearedThroughIdx: index("meal_clearances_cleared_through_idx").on(table.clearedThrough),
  }),
);

export const attendance = sqliteTable(
  "attendance",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    trainerId: text("trainer_id").references(() => trainers.id, { onDelete: "set null" }),
    date: text("date").notNull(),
    markedAt: text("marked_at").notNull(),
    method: text("method", { enum: ["GPS", "Trainer"] })
      .notNull()
      .default("Trainer"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    accuracyMeters: real("accuracy_meters"),
    distanceMeters: real("distance_meters"),
    ...timestamps,
  },
  (table) => ({
    uniqueClientDate: uniqueIndex("attendance_client_date_idx").on(table.clientId, table.date),
    trainerDateIdx: index("attendance_trainer_date_idx").on(table.trainerId, table.date),
  }),
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    workoutId: text("workout_id").references(() => workouts.id, { onDelete: "set null" }),
    exerciseId: text("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
    difficulty: text("difficulty", { enum: ["Easy", "Moderate", "Hard"] }).notNull(),
    energy: text("energy", { enum: ["Low", "Normal", "High"] }).notNull(),
    issue: text("issue", {
      enum: ["No issue", "Joint pain", "Muscle soreness", "Other"],
    }).notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("feedback_client_id_idx").on(table.clientId),
    workoutIdx: index("feedback_workout_id_idx").on(table.workoutId),
  }),
);

export const measurements = sqliteTable(
  "measurements",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    weight: real("weight"),
    height: real("height"),
    chest: real("chest"),
    waist: real("waist"),
    arms: real("arms"),
    leftBicep: real("left_bicep"),
    rightBicep: real("right_bicep"),
    leftForearm: real("left_forearm"),
    rightForearm: real("right_forearm"),
    upperBelly: real("upper_belly"),
    lowerBelly: real("lower_belly"),
    hip: real("hip"),
    thigh: real("thigh"),
    leftThigh: real("left_thigh"),
    rightThigh: real("right_thigh"),
    calf: real("calf"),
    leftCalf: real("left_calf"),
    rightCalf: real("right_calf"),
    trainerNote: text("trainer_note"),
    condition: text("condition"),
    frontPhotoUrl: text("front_photo_url"),
    sidePhotoUrl: text("side_photo_url"),
    backPhotoUrl: text("back_photo_url"),
    measuredAt: text("measured_at").notNull(),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("measurements_client_id_idx").on(table.clientId),
    measuredAtIdx: index("measurements_measured_at_idx").on(table.measuredAt),
  }),
);

export const goals = sqliteTable(
  "goals",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startValue: real("start_value").notNull(),
    currentValue: real("current_value").notNull(),
    targetValue: real("target_value").notNull(),
    unit: text("unit").notNull(),
    reverse: integer("reverse", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("goals_client_id_idx").on(table.clientId),
  }),
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    plan: text("plan").notNull(),
    status: text("status", { enum: ["Paid", "Due Soon", "Unpaid"] }).notNull(),
    paidAt: text("paid_at"),
    dueDate: text("due_date"),
    provider: text("provider"),
    providerPaymentId: text("provider_payment_id"),
    ...timestamps,
  },
  (table) => ({
    clientIdx: index("payments_client_id_idx").on(table.clientId),
    statusIdx: index("payments_status_idx").on(table.status),
  }),
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: text("read_at"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("notifications_user_id_idx").on(table.userId),
    readIdx: index("notifications_read_at_idx").on(table.readAt),
  }),
);

export const refreshSessions = sqliteTable(
  "refresh_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenId: text("token_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    persistent: integer("persistent", { mode: "boolean" }).notNull().default(false),
    userAgent: text("user_agent"),
    lastUsedAt: text("last_used_at"),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("refresh_sessions_user_id_idx").on(table.userId),
    tokenIdx: uniqueIndex("refresh_sessions_token_id_idx").on(table.tokenId),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  trainer: one(trainers, { fields: [users.id], references: [trainers.userId] }),
  notifications: many(notifications),
  refreshSessions: many(refreshSessions),
}));

export const trainersRelations = relations(trainers, ({ one, many }) => ({
  user: one(users, { fields: [trainers.userId], references: [users.id] }),
  clients: many(clients),
  workouts: many(workouts),
  attendance: many(attendance),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  trainer: one(trainers, { fields: [clients.trainerId], references: [trainers.id] }),
  workouts: many(workouts),
  meals: many(mealLogs),
  attendance: many(attendance),
  feedback: many(feedback),
  measurements: many(measurements),
  goals: many(goals),
  payments: many(payments),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  trainer: one(trainers, { fields: [workouts.trainerId], references: [trainers.id] }),
  client: one(clients, { fields: [workouts.clientId], references: [clients.id] }),
  exercises: many(exercises),
  feedback: many(feedback),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
  feedback: many(feedback),
}));
