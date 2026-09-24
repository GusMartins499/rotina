"use server";

import { mondayOf } from "../../domain/week";
import { getDatabase } from "../../repository/db";
import { createBlock, requireWeek } from "../../repository/weeks";
import type { AllocateResult } from "./useAllocation";

export async function allocateBlockAction(input: {
  commitmentId: number;
  weekday: number;
  startHour: number;
  endHour: number;
}): Promise<AllocateResult> {
  try {
    const db = getDatabase();
    const week = requireWeek(db, mondayOf(new Date().toISOString().slice(0, 10)));
    const block = createBlock(db, { weekId: week.id, ...input });
    return { ok: true, block };
  } catch (cause) {
    console.error("block allocation failed", cause);
    return { ok: false, error: "Não foi possível salvar esse bloco." };
  }
}
