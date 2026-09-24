import { describe, it, expect, beforeEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createInMemoryDatabase } from "./testing";

let db: Database;

const insertCommitment = (values: {
  name: string;
  color: string;
  dailyMinutes: number | null;
}) =>
  db
    .prepare("INSERT INTO commitments (name, color, daily_minutes) VALUES (?, ?, ?)")
    .run(values.name, values.color, values.dailyMinutes);

const insertWeek = (mondayDate: string, kind: "current" | "next") =>
  db.prepare("INSERT INTO weeks (monday_date, kind) VALUES (?, ?)").run(mondayDate, kind);

const insertBlock = (values: {
  weekId: number;
  commitmentId: number;
  weekday: number;
  startMinute: number;
  endMinute: number;
}) =>
  db
    .prepare(
      "INSERT INTO blocks (week_id, commitment_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      values.weekId,
      values.commitmentId,
      values.weekday,
      values.startMinute,
      values.endMinute,
    );

beforeEach(() => {
  db = createInMemoryDatabase().connection;
  insertCommitment({ name: "TRABALHO", color: "#d73a4a", dailyMinutes: 480 });
  insertWeek("2026-09-21", "current");
});

describe("domain schema", () => {
  it("persists a commitment with daily minutes and color", () => {
    const stored = db
      .prepare("SELECT daily_minutes AS dailyMinutes FROM commitments WHERE name = ?")
      .get("TRABALHO") as { dailyMinutes: number };

    expect(stored.dailyMinutes).toBe(480);
  });

  it("accepts a commitment without daily hours", () => {
    insertCommitment({ name: "Psicólogo", color: "#8250df", dailyMinutes: null });

    const stored = db
      .prepare("SELECT daily_minutes AS dailyMinutes FROM commitments WHERE name = ?")
      .get("Psicólogo") as { dailyMinutes: number | null };

    expect(stored.dailyMinutes).toBeNull();
  });

  it("rejects a block overlapping another on the same weekday and week", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 });

    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 360, endMinute: 480 }),
    ).toThrow();
  });

  it("allows the same interval on a different weekday", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 });

    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 1, startMinute: 120, endMinute: 420 }),
    ).not.toThrow();
  });

  it("rejects a block whose endMinute is not greater than startMinute", () => {
    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 240, endMinute: 240 }),
    ).toThrow();
  });

  it("rejects a block outside the 06:00-23:00 range", () => {
    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: -60, endMinute: 60 }),
    ).toThrow();
  });

  it("rejects a second week with the same kind", () => {
    expect(() => insertWeek("2026-09-28", "current")).toThrow();
  });

  it("allows one current week and one next week", () => {
    expect(() => insertWeek("2026-09-28", "next")).not.toThrow();
  });

  it("cascades block deletion when the week is removed", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 });
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 1, startMinute: 120, endMinute: 420 });
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 2, startMinute: 120, endMinute: 420 });

    db.prepare("DELETE FROM weeks WHERE id = ?").run(1);

    const remaining = db
      .prepare("SELECT COUNT(*) AS total FROM blocks WHERE week_id = ?")
      .get(1) as { total: number };

    expect(remaining.total).toBe(0);
  });

  it("keeps commitments when a week is removed", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 });

    db.prepare("DELETE FROM weeks WHERE id = ?").run(1);

    const remaining = db.prepare("SELECT COUNT(*) AS total FROM commitments").get() as {
      total: number;
    };

    expect(remaining.total).toBe(1);
  });
});
