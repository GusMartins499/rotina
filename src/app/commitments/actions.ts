"use server";

import { revalidatePath } from "next/cache";
import { commitmentInputSchema, type CommitmentInput } from "../../domain/commitment";
import { getDatabase } from "../../repository/db";
import {
  createCommitment,
  deleteCommitment,
  updateCommitment,
} from "../../repository/commitments";
import type { SubmitResult } from "./CommitmentForm";

const FAILURE = "Não foi possível salvar. Tente de novo.";

function run(operation: () => void): SubmitResult {
  try {
    operation();
    revalidatePath("/");
    return { ok: true };
  } catch (cause) {
    console.error("commitment operation failed", cause);
    return { ok: false, error: FAILURE };
  }
}

export async function createCommitmentAction(input: CommitmentInput): Promise<SubmitResult> {
  const parsed = commitmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  return run(() => createCommitment(getDatabase(), parsed.data));
}

export async function updateCommitmentAction(
  id: number,
  input: CommitmentInput,
): Promise<SubmitResult> {
  const parsed = commitmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }

  return run(() => updateCommitment(getDatabase(), id, parsed.data));
}

export async function deleteCommitmentAction(id: number): Promise<SubmitResult> {
  return run(() => deleteCommitment(getDatabase(), id));
}
