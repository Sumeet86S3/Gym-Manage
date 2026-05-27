ALTER TABLE `trainers` ADD `gym_name` text DEFAULT 'FitSphere Elite Studio' NOT NULL;
ALTER TABLE `trainers` ADD `gym_address` text DEFAULT 'Indiranagar Performance Hub' NOT NULL;
ALTER TABLE `trainers` ADD `gym_latitude` real DEFAULT 12.9719 NOT NULL;
ALTER TABLE `trainers` ADD `gym_longitude` real DEFAULT 77.6412 NOT NULL;
ALTER TABLE `trainers` ADD `attendance_radius_meters` integer DEFAULT 100 NOT NULL;

ALTER TABLE `attendance` ADD `method` text DEFAULT 'Trainer' NOT NULL;
ALTER TABLE `attendance` ADD `latitude` real;
ALTER TABLE `attendance` ADD `longitude` real;
ALTER TABLE `attendance` ADD `accuracy_meters` real;
ALTER TABLE `attendance` ADD `distance_meters` real;
