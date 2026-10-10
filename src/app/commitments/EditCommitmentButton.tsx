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

  return <EditCommitmentForm value={value} onSave={onSave} onClose={() => setEditing(false)} />;
}

type FormProps = Props & {
  onClose: () => void;
};

export function EditCommitmentForm({ value, onSave, onClose }: FormProps) {
  return (
    <CommitmentForm
      initialValue={value}
      autoFocus
      cancelLabel="Cancelar edição"
      onCancel={onClose}
      onSubmit={async (input) => {
        const result = await onSave(input);
        if (result.ok) {
          onClose();
        }
        return result;
      }}
    />
  );
}
