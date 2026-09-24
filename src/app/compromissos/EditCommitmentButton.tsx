"use client";

import { useState } from "react";
import type { CommitmentInput } from "../../domain/commitment";
import { CommitmentForm, type SubmitResult } from "./CommitmentForm";

type Props = {
  value: CommitmentInput;
  onSave: (input: CommitmentInput) => Promise<SubmitResult>;
};

export function EditCommitmentButton({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}>
        Editar
      </button>
    );
  }

  return (
    <>
      <CommitmentForm
        initialValue={value}
        onSubmit={async (input) => {
          const result = await onSave(input);
          if (result.ok) {
            setEditing(false);
          }
          return result;
        }}
      />
      <button type="button" onClick={() => setEditing(false)}>
        Cancelar edição
      </button>
    </>
  );
}
