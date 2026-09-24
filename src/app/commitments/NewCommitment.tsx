"use client";

import { CommitmentForm } from "./CommitmentForm";
import { createCommitmentAction } from "./actions";

export function NewCommitment() {
  return <CommitmentForm onSubmit={createCommitmentAction} submitLabel="Salvar compromisso" />;
}
