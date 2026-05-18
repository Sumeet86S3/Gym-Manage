CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `role` text NOT NULL,
  `approval_status` text DEFAULT 'Approved' NOT NULL,
  `token_version` integer DEFAULT 0 NOT NULL,
  `last_login_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text
);
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
CREATE INDEX `users_role_idx` ON `users` (`role`);

CREATE TABLE `trainers` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `bio` text,
  `specialization` text,
  `status` text DEFAULT 'Pending' NOT NULL,
  `joined_at` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `trainers_user_id_idx` ON `trainers` (`user_id`);
CREATE INDEX `trainers_status_idx` ON `trainers` (`status`);

CREATE TABLE `clients` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `trainer_id` text,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `goal` text DEFAULT 'General fitness' NOT NULL,
  `status` text DEFAULT 'Active' NOT NULL,
  `last_visit` text,
  `joined_at` text NOT NULL,
  `streak` integer DEFAULT 0 NOT NULL,
  `plan` text DEFAULT 'Standard Monthly' NOT NULL,
  `payment_status` text DEFAULT 'Paid' NOT NULL,
  `due_date` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `clients_email_idx` ON `clients` (`email`);
CREATE INDEX `clients_trainer_id_idx` ON `clients` (`trainer_id`);

CREATE TABLE `workouts` (
  `id` text PRIMARY KEY NOT NULL,
  `trainer_id` text,
  `client_id` text,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `duration_minutes` integer DEFAULT 45 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `workouts_trainer_id_idx` ON `workouts` (`trainer_id`);
CREATE INDEX `workouts_client_id_idx` ON `workouts` (`client_id`);

CREATE TABLE `exercises` (
  `id` text PRIMARY KEY NOT NULL,
  `workout_id` text,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `equipment` text NOT NULL,
  `sets` integer DEFAULT 1 NOT NULL,
  `reps` integer DEFAULT 1 NOT NULL,
  `weight` real DEFAULT 0 NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `exercises_workout_id_idx` ON `exercises` (`workout_id`);

CREATE TABLE `meal_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `type` text NOT NULL,
  `note` text,
  `image_url` text NOT NULL,
  `logged_at` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `meal_logs_client_id_idx` ON `meal_logs` (`client_id`);
CREATE INDEX `meal_logs_logged_at_idx` ON `meal_logs` (`logged_at`);

CREATE TABLE `attendance` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `trainer_id` text,
  `date` text NOT NULL,
  `marked_at` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX `attendance_client_date_idx` ON `attendance` (`client_id`, `date`);
CREATE INDEX `attendance_trainer_date_idx` ON `attendance` (`trainer_id`, `date`);

CREATE TABLE `feedback` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `workout_id` text,
  `exercise_id` text,
  `difficulty` text NOT NULL,
  `energy` text NOT NULL,
  `issue` text NOT NULL,
  `notes` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `feedback_client_id_idx` ON `feedback` (`client_id`);
CREATE INDEX `feedback_workout_id_idx` ON `feedback` (`workout_id`);

CREATE TABLE `measurements` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `weight` real,
  `chest` real,
  `waist` real,
  `arms` real,
  `upper_belly` real,
  `lower_belly` real,
  `hip` real,
  `thigh` real,
  `calf` real,
  `measured_at` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `measurements_client_id_idx` ON `measurements` (`client_id`);
CREATE INDEX `measurements_measured_at_idx` ON `measurements` (`measured_at`);

CREATE TABLE `goals` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `title` text NOT NULL,
  `start_value` real NOT NULL,
  `current_value` real NOT NULL,
  `target_value` real NOT NULL,
  `unit` text NOT NULL,
  `reverse` integer DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `goals_client_id_idx` ON `goals` (`client_id`);

CREATE TABLE `payments` (
  `id` text PRIMARY KEY NOT NULL,
  `client_id` text NOT NULL,
  `amount` integer NOT NULL,
  `currency` text DEFAULT 'INR' NOT NULL,
  `plan` text NOT NULL,
  `status` text NOT NULL,
  `paid_at` text,
  `due_date` text,
  `provider` text,
  `provider_payment_id` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `payments_client_id_idx` ON `payments` (`client_id`);
CREATE INDEX `payments_status_idx` ON `payments` (`status`);

CREATE TABLE `notifications` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `body` text NOT NULL,
  `read_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);
CREATE INDEX `notifications_read_at_idx` ON `notifications` (`read_at`);
