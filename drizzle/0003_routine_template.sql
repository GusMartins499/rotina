CREATE TABLE `template_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`commitment_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_hour` integer NOT NULL,
	`end_hour` integer NOT NULL,
	FOREIGN KEY (`commitment_id`) REFERENCES `commitments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "template_weekday_range" CHECK("template_blocks"."weekday" >= 0 AND "template_blocks"."weekday" <= 6),
	CONSTRAINT "template_within_day" CHECK("template_blocks"."start_hour" >= 6 AND "template_blocks"."end_hour" <= 23),
	CONSTRAINT "template_positive_duration" CHECK("template_blocks"."end_hour" > "template_blocks"."start_hour")
);
