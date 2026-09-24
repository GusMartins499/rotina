"use server";

import { mondayOf } from "../../domain/week";
import { getDatabase } from "../../repository/db";
import { createBlock, deleteBlock, ensureWeekPair, updateBlock } from "../../repository/weeks";
import { applyRollover, applyTemplate, saveTemplate } from "../../repository/rollover";
import { revalidatePath } from "next/cache";
import type { AllocateResult, WriteResult } from "./useAllocation";

type Placement = { weekday: number; startHour: number; endHour: number };

const FAILURE = "Não foi possível salvar essa mudança.";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekInFocus(focus: "current" | "next") {
  const db = getDatabase();
  applyRollover(db, today());
  const pair = ensureWeekPair(db, mondayOf(today()));
  return { db, week: focus === "next" ? pair.next : pair.current };
}

export async function allocateBlockAction(
  input: Placement & { commitmentId: number; focus: "current" | "next" },
): Promise<AllocateResult> {
  try {
    const { db, week } = weekInFocus(input.focus);
    const { focus, ...values } = input;
    return { ok: true, block: createBlock(db, { weekId: week.id, ...values }) };
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

export async function saveTemplateAction(focus: "current" | "next"): Promise<WriteResult> {
  try {
    const { db, week } = weekInFocus(focus);
    saveTemplate(db, week.id);
    return { ok: true };
  } catch (cause) {
    console.error("saving the routine template failed", cause);
    return { ok: false, error: FAILURE };
  }
}

export async function applyTemplateAction(focus: "current" | "next"): Promise<WriteResult> {
  try {
    const { db, week } = weekInFocus(focus);
    applyTemplate(db, week.id);
    revalidatePath("/");
    return { ok: true };
  } catch (cause) {
    console.error("applying the routine template failed", cause);
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : FAILURE,
    };
  }
}
