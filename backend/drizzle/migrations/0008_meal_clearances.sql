CREATE TABLE `meal_clearances` (
  `client_id` text PRIMARY KEY NOT NULL,
  `cleared_through` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deleted_at` text,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `meal_clearances_cleared_through_idx` ON `meal_clearances` (`cleared_through`);
