import { describe, it, expect, beforeEach } from "vitest";
import { PALETTE } from "../domain/commitment";
import { createCommitment } from "./commitments";
import { createInMemoryDatabase } from "./testing";
import { createBlock, listBlocksOfWeek, requireWeek } from "./weeks";
import type { AppDatabase } from "./db";

let db: AppDatabase;

beforeEach(() => {
  db = createInMemoryDatabase().db;
});

describe("weeks repository", () => {
  it("creates the current week on first access", () => {
    const week = requireWeek(db, "2026-09-21");

    expect(week.mondayDate).toBe("2026-09-21");
    expect(week.kind).toBe("current");
  });

  it("returns the same week on a second access", () => {
    const first = requireWeek(db, "2026-09-21");
    const second = requireWeek(db, "2026-09-21");

    expect(second.id).toBe(first.id);
  });

  it("stores a block and lists it back for its week", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyHours: 8,
    });

    createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startHour: 8,
      endHour: 16,
    });

    expect(listBlocksOfWeek(db, week.id)).toEqual([
      expect.objectContaining({ weekday: 0, startHour: 8, endHour: 16 }),
    ]);
  });

  it("rejects a block that overlaps another on the same weekday", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyHours: 8,
    });
    createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startHour: 8,
      endHour: 13,
    });

    expect(() =>
      createBlock(db, {
        weekId: week.id,
        commitmentId: commitment.id,
        weekday: 0,
        startHour: 12,
        endHour: 14,
      }),
    ).toThrow();
  });

  it("lists blocks in grid reading order", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "FLASHCARDS",
      color: PALETTE[1],
      dailyHours: 1,
    });
    for (const [weekday, startHour] of [
      [1, 9],
      [0, 20],
      [0, 7],
    ] as const) {
      createBlock(db, {
        weekId: week.id,
        commitmentId: commitment.id,
        weekday,
        startHour,
        endHour: startHour + 1,
      });
    }

    expect(listBlocksOfWeek(db, week.id).map((b) => [b.weekday, b.startHour])).toEqual([
      [0, 7],
      [0, 20],
      [1, 9],
    ]);
  });
});
