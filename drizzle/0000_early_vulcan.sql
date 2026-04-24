CREATE TABLE `daily_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`symbol` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`price` real NOT NULL,
	`crossing` text NOT NULL,
	`notes` text DEFAULT '',
	`current_price` real,
	`previous_high` real,
	`previous_low` real,
	`previous_close` real,
	`fifty_two_week_high` real,
	`fifty_two_week_low` real,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);