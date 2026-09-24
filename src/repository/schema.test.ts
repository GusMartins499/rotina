import { describe, it, expect, beforeEach } from "vitest";
import type { Database } from "better-sqlite3";
import { createInMemoryDatabase } from "./testing.js";

let db: Database;

const insertCommitment = (values: {
  name: string;
  color: string;
  dailyHours: number | null;
}) =>
  db
    .prepare("INSERT INTO commitments (name, color, daily_hours) VALUES (?, ?, ?)")
    .run(values.name, values.color, values.dailyHours);

const insertWeek = (mondayDate: string, kind: "current" | "next") =>
  db.prepare("INSERT INTO weeks (monday_date, kind) VALUES (?, ?)").run(mondayDate, kind);

const insertBlock = (values: {
  weekId: number;
  commitmentId: number;
  weekday: number;
  startHour: number;
  endHour: number;
}) =>
  db
    .prepare(
      "INSERT INTO blocks (week_id, commitment_id, weekday, start_hour, end_hour) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      values.weekId,
      values.commitmentId,
      values.weekday,
      values.startHour,
      values.endHour,
    );

beforeEach(() => {
  db = createInMemoryDatabase();
  insertCommitment({ name: "TRABALHO", color: "#d73a4a", dailyHours: 8 });
  insertWeek("2026-09-21", "current");
});

describe("domain schema", () => {
  it("persists a commitment with daily hours and color", () => {
    const stored = db
      .prepare("SELECT daily_hours AS dailyHours FROM commitments WHERE name = ?")
      .get("TRABALHO") as { dailyHours: number };

    expect(stored.dailyHours).toBe(8);
  });

  it("accepts a commitment without daily hours", () => {
    insertCommitment({ name: "Psicólogo", color: "#8250df", dailyHours: null });

    const stored = db
      .prepare("SELECT daily_hours AS dailyHours FROM commitments WHERE name = ?")
      .get("Psicólogo") as { dailyHours: number | null };

    expect(stored.dailyHours).toBeNull();
  });

  it("rejects a block overlapping another on the same weekday and week", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 });

    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 12, endHour: 14 }),
    ).toThrow();
  });

  it("allows the same interval on a different weekday", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 });

    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 1, startHour: 8, endHour: 13 }),
    ).not.toThrow();
  });

  it("rejects a block whose endHour is not greater than startHour", () => {
    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 10, endHour: 10 }),
    ).toThrow();
  });

  it("rejects a block outside the 06:00-23:00 range", () => {
    expect(() =>
      insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 5, endHour: 7 }),
    ).toThrow();
  });

  it("rejects a second week with the same kind", () => {
    expect(() => insertWeek("2026-09-28", "current")).toThrow();
  });

  it("allows one current week and one next week", () => {
    expect(() => insertWeek("2026-09-28", "next")).not.toThrow();
  });

  it("cascades block deletion when the week is removed", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 });
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 1, startHour: 8, endHour: 13 });
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 2, startHour: 8, endHour: 13 });

    db.prepare("DELETE FROM weeks WHERE id = ?").run(1);

    const remaining = db
      .prepare("SELECT COUNT(*) AS total FROM blocks WHERE week_id = ?")
      .get(1) as { total: number };

    expect(remaining.total).toBe(0);
  });

  it("keeps commitments when a week is removed", () => {
    insertBlock({ weekId: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 });

    db.prepare("DELETE FROM weeks WHERE id = ?").run(1);

    const remaining = db.prepare("SELECT COUNT(*) AS total FROM commitments").get() as {
      total: number;
    };

    expect(remaining.total).toBe(1);
  });
});
