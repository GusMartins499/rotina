import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "./db";
import { nextMonday } from "../domain/week";
import { blocks, weeks, type Block, type Week } from "./schema";

export function requireWeek(
  db: AppDatabase,
  mondayDate: string,
  kind: Week["kind"] = "current",
): Week {
  const existing = db.select().from(weeks).where(eq(weeks.mondayDate, mondayDate)).get();
  if (existing !== undefined) {
    return existing;
  }

  return db.insert(weeks).values({ mondayDate, kind }).returning().get();
}

export function ensureWeekPair(
  db: AppDatabase,
  todayMonday: string,
): { current: Week; next: Week } {
  return {
    current: requireWeek(db, todayMonday, "current"),
    next: requireWeek(db, nextMonday(todayMonday), "next"),
  };
}

export function listBlocksOfWeek(db: AppDatabase, weekId: number): Block[] {
  return db
    .select()
    .from(blocks)
    .where(eq(blocks.weekId, weekId))
    .orderBy(asc(blocks.weekday), asc(blocks.startMinute))
    .all();
}

export function createBlock(db: AppDatabase, values: Omit<Block, "id">): Block {
  return db.insert(blocks).values(values).returning().get();
}

export function updateBlock(
  db: AppDatabase,
  id: number,
  values: Pick<Block, "weekday" | "startMinute" | "endMinute">,
): Block {
  return db.update(blocks).set(values).where(eq(blocks.id, id)).returning().get();
}

export function deleteBlock(db: AppDatabase, id: number): void {
  db.delete(blocks).where(eq(blocks.id, id)).run();
}
