"use client";

import type { CommitmentInput } from "../../domain/commitment";
import { EditCommitmentButton } from "./EditCommitmentButton";
import { updateCommitmentAction } from "./actions";

type Props = {
  id: number;
  value: CommitmentInput;
};

export function EditCommitment({ id, value }: Props) {
  return (
    <EditCommitmentButton
      value={value}
      onSave={(input) => updateCommitmentAction(id, input)}
    />
  );
}
