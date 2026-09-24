import { asc, eq, inArray } from "drizzle-orm";
import { rolloverPlan } from "../domain/rollover";
import type { AppDatabase } from "./db";
import { blocks, templateBlocks, weeks, type Week } from "./schema";
import { listBlocksOfWeek } from "./weeks";

export function listWeeks(db: AppDatabase): Week[] {
  return db.select().from(weeks).orderBy(asc(weeks.mondayDate)).all();
}

export function applyRollover(db: AppDatabase, today: string): void {
  const stored = listWeeks(db);
  const current = stored.find((week) => week.kind === "current");

  if (current === undefined) {
    return;
  }

  const plan = rolloverPlan(today, current.mondayDate);

  if (plan.promote === null && plan.discard.length === 0 && plan.create.length === 0) {
    return;
  }

  db.transaction((tx) => {
    tx.delete(weeks).where(inArray(weeks.mondayDate, plan.discard)).run();

    if (plan.promote !== null) {
      tx.update(weeks).set({ kind: "current" }).where(eq(weeks.mondayDate, plan.promote)).run();
    }

    plan.create.forEach((mondayDate, index) => {
      tx.insert(weeks)
        .values({
          mondayDate,
          kind: plan.promote === null && index === 0 ? "current" : "next",
        })
        .run();
    });
  });
}

export function saveTemplate(db: AppDatabase, weekId: number): void {
  const source = listBlocksOfWeek(db, weekId);

  db.transaction((tx) => {
    tx.delete(templateBlocks).run();
    for (const block of source) {
      tx.insert(templateBlocks)
        .values({
          commitmentId: block.commitmentId,
          weekday: block.weekday,
          startHour: block.startHour,
          endHour: block.endHour,
        })
        .run();
    }
  });
}

export function applyTemplate(db: AppDatabase, weekId: number): void {
  if (listBlocksOfWeek(db, weekId).length > 0) {
    throw new Error("A semana não está vazia.");
  }

  const template = db.select().from(templateBlocks).all();

  db.transaction((tx) => {
    for (const block of template) {
      tx.insert(blocks)
        .values({
          weekId,
          commitmentId: block.commitmentId,
          weekday: block.weekday,
          startHour: block.startHour,
          endHour: block.endHour,
        })
        .run();
    }
  });
}
