"use client";

import { CommitmentForm } from "./CommitmentForm";
import { createCommitmentAction } from "./actions";

type Props = {
  onDone?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function NewCommitment({ onDone, onCancel, autoFocus = false }: Props) {
  return (
    <CommitmentForm
      submitLabel="Salvar compromisso"
      autoFocus={autoFocus}
      onCancel={onCancel}
      onSubmit={async (input) => {
        const result = await createCommitmentAction(input);
        if (result.ok) {
          onDone?.();
        }
        return result;
      }}
    />
  );
}
