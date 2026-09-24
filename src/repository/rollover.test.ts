import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { PALETTE } from "../domain/commitment";
import { createCommitment } from "./commitments";
import { createInMemoryDatabase } from "./testing";
import { applyRollover, applyTemplate, listWeeks, saveTemplate } from "./rollover";
import { createBlock, listBlocksOfWeek, requireWeek } from "./weeks";
import { weeks } from "./schema";
import type { AppDatabase } from "./db";

let db: AppDatabase;
let commitmentId: number;

beforeEach(() => {
  db = createInMemoryDatabase().db;
  commitmentId = createCommitment(db, {
    name: "TRABALHO",
    color: PALETTE[0],
    dailyHours: 8,
  }).id;
});

function seedPair(currentMonday: string, nextMonday: string) {
  const current = requireWeek(db, currentMonday);
  db.insert(weeks).values({ mondayDate: nextMonday, kind: "next" }).run();
  return current;
}

describe("rollover", () => {
  it("keeps both weeks when today is inside the current week", () => {
    seedPair("2026-09-21", "2026-09-28");

    applyRollover(db, "2026-09-23");

    expect(listWeeks(db).map((w) => w.mondayDate)).toEqual(["2026-09-21", "2026-09-28"]);
  });

  it("promotes the next week and discards the finished one", () => {
    seedPair("2026-09-21", "2026-09-28");

    applyRollover(db, "2026-09-28");

    const stored = listWeeks(db);
    expect(stored.map((w) => [w.mondayDate, w.kind])).toEqual([
      ["2026-09-28", "current"],
      ["2026-10-05", "next"],
    ]);
  });

  it("drops the blocks of the discarded week", () => {
    const current = seedPair("2026-09-21", "2026-09-28");
    createBlock(db, {
      weekId: current.id,
      commitmentId,
      weekday: 0,
      startHour: 8,
      endHour: 13,
    });

    applyRollover(db, "2026-09-28");

    expect(db.select().from(weeks).where(eq(weeks.mondayDate, "2026-09-21")).all()).toHaveLength(0);
  });

  it("creates a fresh pair when the app sat unopened for weeks", () => {
    seedPair("2026-09-21", "2026-09-28");

    applyRollover(db, "2026-10-12");

    expect(listWeeks(db).map((w) => [w.mondayDate, w.kind])).toEqual([
      ["2026-10-12", "current"],
      ["2026-10-19", "next"],
    ]);
  });

  it("leaves no orphan week behind after a long gap", () => {
    seedPair("2026-09-21", "2026-09-28");

    applyRollover(db, "2026-10-12");

    expect(listWeeks(db)).toHaveLength(2);
  });

  it("is idempotent when called twice for the same day", () => {
    seedPair("2026-09-21", "2026-09-28");

    applyRollover(db, "2026-09-28");
    applyRollover(db, "2026-09-28");

    expect(listWeeks(db)).toHaveLength(2);
  });
});

describe("routine template", () => {
  it("saves the blocks of a week as the base routine", () => {
    const week = requireWeek(db, "2026-09-21", "current");
    createBlock(db, { weekId: week.id, commitmentId, weekday: 0, startHour: 8, endHour: 13 });

    saveTemplate(db, week.id);

    const target = requireWeek(db, "2026-09-28", "next");
    applyTemplate(db, target.id);

    expect(listBlocksOfWeek(db, target.id)).toEqual([
      expect.objectContaining({ weekday: 0, startHour: 8, endHour: 13 }),
    ]);
  });

  it("replaces the previous template when saved again", () => {
    const week = requireWeek(db, "2026-09-21", "current");
    createBlock(db, { weekId: week.id, commitmentId, weekday: 0, startHour: 8, endHour: 13 });
    saveTemplate(db, week.id);
    createBlock(db, { weekId: week.id, commitmentId, weekday: 1, startHour: 9, endHour: 10 });
    saveTemplate(db, week.id);

    const target = requireWeek(db, "2026-09-28", "next");
    applyTemplate(db, target.id);

    expect(listBlocksOfWeek(db, target.id)).toHaveLength(2);
  });

  it("refuses to apply the template over a week that already has blocks", () => {
    const week = requireWeek(db, "2026-09-21", "current");
    createBlock(db, { weekId: week.id, commitmentId, weekday: 0, startHour: 8, endHour: 13 });
    saveTemplate(db, week.id);

    expect(() => applyTemplate(db, week.id)).toThrow(/não está vazia/i);
  });
});
