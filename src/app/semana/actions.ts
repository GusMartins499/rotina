"use server";

import { mondayOf } from "../../domain/week";
import { getDatabase } from "../../repository/db";
import { createBlock, deleteBlock, requireWeek, updateBlock } from "../../repository/weeks";
import type { AllocateResult, WriteResult } from "./useAllocation";

type Placement = { weekday: number; startHour: number; endHour: number };

const FAILURE = "Não foi possível salvar essa mudança.";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function allocateBlockAction(
  input: Placement & { commitmentId: number },
): Promise<AllocateResult> {
  try {
    const db = getDatabase();
    const week = requireWeek(db, mondayOf(today()));
    return { ok: true, block: createBlock(db, { weekId: week.id, ...input }) };
  } catch (cause) {
    console.error("block allocation failed", cause);
    return { ok: false, error: FAILURE };
  }
}

export async function moveBlockAction(id: number, values: Placement): Promise<WriteResult> {
  try {
    updateBlock(getDatabase(), id, values);
    return { ok: true };
  } catch (cause) {
    console.error("block move failed", { id, cause });
    return { ok: false, error: FAILURE };
  }
}

export async function removeBlockAction(id: number): Promise<WriteResult> {
  try {
    deleteBlock(getDatabase(), id);
    return { ok: true };
  } catch (cause) {
    console.error("block removal failed", { id, cause });
    return { ok: false, error: FAILURE };
  }
}
