DROP TRIGGER IF EXISTS `blocks_no_overlap_on_insert`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `blocks_no_overlap_on_update`;
--> statement-breakpoint
CREATE TABLE `commitments_minutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`daily_minutes` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	CONSTRAINT "commitments_daily_hours_range" CHECK("commitments_minutes"."daily_minutes" IS NULL OR ("commitments_minutes"."daily_minutes" >= 30 AND "commitments_minutes"."daily_minutes" <= 1020))
);
--> statement-breakpoint
INSERT INTO `commitments_minutes` (`id`, `name`, `color`, `daily_minutes`, `created_at`)
SELECT `id`, `name`, `color`, `daily_hours` * 60, `created_at` FROM `commitments`;
--> statement-breakpoint
CREATE TABLE `blocks_minutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_id` integer NOT NULL,
	`commitment_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commitment_id`) REFERENCES `commitments_minutes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "blocks_weekday_range" CHECK("blocks_minutes"."weekday" >= 0 AND "blocks_minutes"."weekday" <= 6),
	CONSTRAINT "blocks_within_day" CHECK("blocks_minutes"."start_minute" >= 0 AND "blocks_minutes"."end_minute" <= 1020),
	CONSTRAINT "blocks_positive_duration" CHECK("blocks_minutes"."end_minute" > "blocks_minutes"."start_minute")
);
--> statement-breakpoint
INSERT INTO `blocks_minutes` (`id`, `week_id`, `commitment_id`, `weekday`, `start_minute`, `end_minute`)
SELECT `id`, `week_id`, `commitment_id`, `weekday`, (`start_hour` - 6) * 60, (`end_hour` - 6) * 60 FROM `blocks`;
--> statement-breakpoint
CREATE TABLE `template_blocks_minutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`commitment_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	FOREIGN KEY (`commitment_id`) REFERENCES `commitments_minutes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "template_weekday_range" CHECK("template_blocks_minutes"."weekday" >= 0 AND "template_blocks_minutes"."weekday" <= 6),
	CONSTRAINT "template_within_day" CHECK("template_blocks_minutes"."start_minute" >= 0 AND "template_blocks_minutes"."end_minute" <= 1020),
	CONSTRAINT "template_positive_duration" CHECK("template_blocks_minutes"."end_minute" > "template_blocks_minutes"."start_minute")
);
--> statement-breakpoint
INSERT INTO `template_blocks_minutes` (`id`, `commitment_id`, `weekday`, `start_minute`, `end_minute`)
SELECT `id`, `commitment_id`, `weekday`, (`start_hour` - 6) * 60, (`end_hour` - 6) * 60 FROM `template_blocks`;
--> statement-breakpoint
DROP TABLE `blocks`;
--> statement-breakpoint
DROP TABLE `template_blocks`;
--> statement-breakpoint
DROP TABLE `commitments`;
--> statement-breakpoint
ALTER TABLE `commitments_minutes` RENAME TO `commitments`;
--> statement-breakpoint
ALTER TABLE `blocks_minutes` RENAME TO `blocks`;
--> statement-breakpoint
ALTER TABLE `template_blocks_minutes` RENAME TO `template_blocks`;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_on_insert
BEFORE INSERT ON blocks
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM blocks
  WHERE week_id = NEW.week_id
    AND weekday = NEW.weekday
    AND NEW.start_minute < end_minute
    AND start_minute < NEW.end_minute
)
BEGIN
  SELECT RAISE(ABORT, 'block overlaps an existing block on this weekday — same rule as domain/overlaps');
END;
--> statement-breakpoint
CREATE TRIGGER blocks_no_overlap_on_update
BEFORE UPDATE ON blocks
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM blocks
  WHERE week_id = NEW.week_id
    AND weekday = NEW.weekday
    AND id <> NEW.id
    AND NEW.start_minute < end_minute
    AND start_minute < NEW.end_minute
)
BEGIN
  SELECT RAISE(ABORT, 'block overlaps an existing block on this weekday — same rule as domain/overlaps');
END;
