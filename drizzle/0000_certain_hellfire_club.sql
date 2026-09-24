CREATE TABLE `blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_id` integer NOT NULL,
	`commitment_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_hour` integer NOT NULL,
	`end_hour` integer NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commitment_id`) REFERENCES `commitments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "blocks_weekday_range" CHECK("blocks"."weekday" >= 0 AND "blocks"."weekday" <= 6),
	CONSTRAINT "blocks_within_day" CHECK("blocks"."start_hour" >= 6 AND "blocks"."end_hour" <= 23),
	CONSTRAINT "blocks_positive_duration" CHECK("blocks"."end_hour" > "blocks"."start_hour")
);
--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`daily_hours` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	CONSTRAINT "commitments_daily_hours_range" CHECK("commitments"."daily_hours" IS NULL OR ("commitments"."daily_hours" >= 1 AND "commitments"."daily_hours" <= 17))
);
--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monday_date` text NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "weeks_kind_values" CHECK("weeks"."kind" IN ('current', 'next'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weeks_monday_date_unique` ON `weeks` (`monday_date`);