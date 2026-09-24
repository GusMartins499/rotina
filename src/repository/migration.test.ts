import { describe, it, expect, beforeEach } from "vitest";
import SqliteDatabase from "better-sqlite3";
import type { Database } from "better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MIGRATIONS_FOLDER } from "./migrationsFolder";

const BEFORE_MINUTES = [
  "0000_certain_hellfire_club",
  "0001_block_overlap_guard",
  "0002_week_kind_unique",
  "0003_routine_template",
];

function applyFile(db: Database, tag: string) {
  const sql = readFileSync(join(MIGRATIONS_FOLDER, `${tag}.sql`), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    db.exec(statement);
  }
}

let db: Database;

beforeEach(() => {
  db = new SqliteDatabase(":memory:");

  for (const tag of BEFORE_MINUTES) {
    applyFile(db, tag);
  }

  db.prepare(
    "INSERT INTO commitments (name, color, daily_hours) VALUES (?, ?, ?)",
  ).run("TRABALHO", "#d73a4a", 8);
  db.prepare(
    "INSERT INTO commitments (name, color, daily_hours) VALUES (?, ?, ?)",
  ).run("Psicologo", "#8250df", null);
  db.prepare("INSERT INTO weeks (monday_date, kind) VALUES (?, ?)").run(
    "2026-09-21",
    "current",
  );
  db.prepare(
    "INSERT INTO blocks (week_id, commitment_id, weekday, start_hour, end_hour) VALUES (?, ?, ?, ?, ?)",
  ).run(1, 1, 0, 8, 13);
  db.prepare(
    "INSERT INTO template_blocks (commitment_id, weekday, start_hour, end_hour) VALUES (?, ?, ?, ?)",
  ).run(1, 1, 7, 8);
});

describe("migration to minutes", () => {
  it("converts existing hour based blocks to minutes from the day start", () => {
    applyFile(db, "0004_minutes");

    const block = db
      .prepare("SELECT start_minute AS s, end_minute AS e FROM blocks")
      .get() as { s: number; e: number };

    expect(block).toEqual({ s: 120, e: 420 });
  });

  it("converts the daily load of existing commitments", () => {
    applyFile(db, "0004_minutes");

    const stored = db
      .prepare("SELECT daily_minutes AS m FROM commitments WHERE name = ?")
      .get("TRABALHO") as { m: number };

    expect(stored.m).toBe(480);
  });

  it("leaves a commitment without daily load untouched", () => {
    applyFile(db, "0004_minutes");

    const stored = db
      .prepare("SELECT daily_minutes AS m FROM commitments WHERE name = ?")
      .get("Psicologo") as { m: number | null };

    expect(stored.m).toBeNull();
  });

  it("converts the routine template too", () => {
    applyFile(db, "0004_minutes");

    const stored = db
      .prepare("SELECT start_minute AS s, end_minute AS e FROM template_blocks")
      .get() as { s: number; e: number };

    expect(stored).toEqual({ s: 60, e: 120 });
  });

  it("keeps the overlap guard working after the migration", () => {
    applyFile(db, "0004_minutes");

    expect(() =>
      db
        .prepare(
          "INSERT INTO blocks (week_id, commitment_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?, ?)",
        )
        .run(1, 1, 0, 360, 480),
    ).toThrow(/overlaps/);
  });

  it("accepts a half hour block after the migration", () => {
    applyFile(db, "0004_minutes");

    expect(() =>
      db
        .prepare(
          "INSERT INTO blocks (week_id, commitment_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?, ?)",
        )
        .run(1, 1, 0, 450, 480),
    ).not.toThrow();
  });

  it("loses no block in the conversion", () => {
    const before = db.prepare("SELECT COUNT(*) AS total FROM blocks").get() as {
      total: number;
    };

    applyFile(db, "0004_minutes");

    const after = db.prepare("SELECT COUNT(*) AS total FROM blocks").get() as {
      total: number;
    };

    expect(after.total).toBe(before.total);
  });
});
