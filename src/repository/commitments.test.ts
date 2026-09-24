import { describe, it, expect, beforeEach } from "vitest";
import { PALETTE } from "../domain/commitment";
import { createInMemoryDatabase } from "./testing";
import {
  countBlocksOf,
  createCommitment,
  deleteCommitment,
  listCommitments,
  updateCommitment,
} from "./commitments";
import type { AppDatabase } from "./db";

let db: AppDatabase;
let raw: ReturnType<typeof createInMemoryDatabase>["connection"];

beforeEach(() => {
  const created = createInMemoryDatabase();
  db = created.db;
  raw = created.connection;
});

describe("commitments repository", () => {
  it("creates a commitment with name, color and daily minutes", () => {
    const created = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });

    expect(created.dailyMinutes).toBe(480);
    expect(listCommitments(db)).toHaveLength(1);
  });

  it("creates a commitment without daily hours", () => {
    const created = createCommitment(db, {
      name: "Psicólogo",
      color: PALETTE[4],
      dailyMinutes: null,
    });

    expect(created.dailyMinutes).toBeNull();
  });

  it("edits name, color and daily hours of an existing commitment", () => {
    const created = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });

    const updated = updateCommitment(db, created.id, {
      name: "TRABALHO REMOTO",
      color: PALETTE[1],
      dailyMinutes: 360,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        name: "TRABALHO REMOTO",
        color: PALETTE[1],
        dailyMinutes: 360,
      }),
    );
  });

  it("deletes a commitment that is not allocated in any week", () => {
    const created = createCommitment(db, {
      name: "LeetCode",
      color: PALETTE[2],
      dailyMinutes: 60,
    });

    deleteCommitment(db, created.id);

    expect(listCommitments(db)).toHaveLength(0);
  });

  it("deletes the blocks of a commitment when the commitment is deleted", () => {
    const created = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    raw.prepare("INSERT INTO weeks (monday_date, kind) VALUES (?, ?)").run(
      "2026-09-21",
      "current",
    );
    raw
      .prepare(
        "INSERT INTO blocks (week_id, commitment_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?, ?)",
      )
      .run(1, created.id, 0, 8, 13);

    deleteCommitment(db, created.id);

    const remaining = raw
      .prepare("SELECT COUNT(*) AS total FROM blocks WHERE commitment_id = ?")
      .get(created.id) as { total: number };
    expect(remaining.total).toBe(0);
  });

  it("counts how many blocks a commitment has allocated", () => {
    const created = createCommitment(db, {
      name: "TRABALHO",
      color: PALETTE[0],
      dailyMinutes: 480,
    });
    raw.prepare("INSERT INTO weeks (monday_date, kind) VALUES (?, ?)").run(
      "2026-09-21",
      "current",
    );
    for (const weekday of [0, 1]) {
      raw
        .prepare(
          "INSERT INTO blocks (week_id, commitment_id, weekday, start_minute, end_minute) VALUES (?, ?, ?, ?, ?)",
        )
        .run(1, created.id, weekday, 8, 13);
    }

    expect(countBlocksOf(db, created.id)).toBe(2);
  });

  it("counts zero blocks for a commitment that is not allocated", () => {
    const created = createCommitment(db, {
      name: "LeetCode",
      color: PALETTE[2],
      dailyMinutes: 60,
    });

    expect(countBlocksOf(db, created.id)).toBe(0);
  });

  it("lists commitments in a stable order", () => {
    createCommitment(db, { name: "Zelda", color: PALETTE[0], dailyMinutes: null });
    createCommitment(db, { name: "Alpha", color: PALETTE[1], dailyMinutes: null });
    createCommitment(db, { name: "Meio", color: PALETTE[2], dailyMinutes: null });

    expect(listCommitments(db).map((c) => c.name)).toEqual(
      listCommitments(db).map((c) => c.name),
    );
    expect(listCommitments(db).map((c) => c.name)).toEqual(["Alpha", "Meio", "Zelda"]);
  });
});
