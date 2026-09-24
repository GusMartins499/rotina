import { describe, it, expect, beforeEach } from "vitest";
import { PALETTE } from "../domain/commitment";
import { createCommitment } from "./commitments";
import { createInMemoryDatabase } from "./testing";
import { createBlock, deleteBlock, listBlocksOfWeek, requireWeek, updateBlock } from "./weeks";
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
      dailyMinutes: 480,
    });

    createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 120,
      endMinute: 600,
    });

    expect(listBlocksOfWeek(db, week.id)).toEqual([
      expect.objectContaining({ weekday: 0, startMinute: 120, endMinute: 600 }),
    ]);
  });

  it("rejects a block that overlaps another on the same weekday", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 120,
      endMinute: 420,
    });

    expect(() =>
      createBlock(db, {
        weekId: week.id,
        commitmentId: commitment.id,
        weekday: 0,
        startMinute: 360,
        endMinute: 480,
      }),
    ).toThrow();
  });

  it("moves a block to another weekday and hour", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    const block = createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 120,
      endMinute: 420,
    });

    updateBlock(db, block.id, { weekday: 1, startMinute: 180, endMinute: 480 });

    expect(listBlocksOfWeek(db, week.id)).toEqual([
      expect.objectContaining({ weekday: 1, startMinute: 180, endMinute: 480 }),
    ]);
  });

  it("rejects an update that would overlap another block", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    const first = createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 120,
      endMinute: 420,
    });
    createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 480,
      endMinute: 660,
    });

    expect(() =>
      updateBlock(db, first.id, { weekday: 0, startMinute: 120, endMinute: 540 }),
    ).toThrow();
  });

  it("removes a block and frees its slot", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    const block = createBlock(db, {
      weekId: week.id,
      commitmentId: commitment.id,
      weekday: 0,
      startMinute: 120,
      endMinute: 420,
    });

    deleteBlock(db, block.id);

    expect(listBlocksOfWeek(db, week.id)).toHaveLength(0);
    expect(() =>
      createBlock(db, {
        weekId: week.id,
        commitmentId: commitment.id,
        weekday: 0,
        startMinute: 120,
        endMinute: 420,
      }),
    ).not.toThrow();
  });

  it("lists blocks in grid reading order", () => {
    const week = requireWeek(db, "2026-09-21");
    const commitment = createCommitment(db, {
      name: "FLASHCARDS",
      color: PALETTE[1],
      dailyMinutes: 60,
    });
    for (const [weekday, startMinute] of [
      [1, 9],
      [0, 20],
      [0, 7],
    ] as const) {
      createBlock(db, {
        weekId: week.id,
        commitmentId: commitment.id,
        weekday,
        startMinute,
        endMinute: startMinute + 1,
      });
    }

    expect(listBlocksOfWeek(db, week.id).map((b) => [b.weekday, b.startMinute])).toEqual([
      [0, 7],
      [0, 20],
      [1, 9],
    ]);
  });
});
