CREATE TRIGGER blocks_no_overlap_on_insert
BEFORE INSERT ON blocks
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM blocks
  WHERE week_id = NEW.week_id
    AND weekday = NEW.weekday
    AND NEW.start_hour < end_hour
    AND start_hour < NEW.end_hour
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
    AND NEW.start_hour < end_hour
    AND start_hour < NEW.end_hour
)
BEGIN
  SELECT RAISE(ABORT, 'block overlaps an existing block on this weekday — same rule as domain/overlaps');
END;
