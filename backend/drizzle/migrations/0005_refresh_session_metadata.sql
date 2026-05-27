ALTER TABLE `refresh_sessions` ADD `persistent` integer DEFAULT false NOT NULL;
ALTER TABLE `refresh_sessions` ADD `user_agent` text;
ALTER TABLE `refresh_sessions` ADD `last_used_at` text;
