CREATE TABLE commitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  daily_hours INTEGER,
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  CONSTRAINT commitments_daily_hours_range
    CHECK (daily_hours IS NULL OR (daily_hours >= 1 AND daily_hours <= 17))
);

CREATE TABLE weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monday_date TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  CONSTRAINT weeks_kind_values CHECK (kind IN ('current', 'next'))
);

CREATE TABLE blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  commitment_id INTEGER NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  CONSTRAINT blocks_weekday_range CHECK (weekday >= 0 AND weekday <= 6),
  CONSTRAINT blocks_within_day CHECK (start_hour >= 6 AND end_hour <= 23),
  CONSTRAINT blocks_positive_duration CHECK (end_hour > start_hour)
);
