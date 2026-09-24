"use client";

import { DeleteCommitmentButton } from "./DeleteCommitmentButton";
import { deleteCommitmentAction } from "./actions";

type Props = {
  id: number;
  name: string;
  allocatedBlocks: number;
};

export function DeleteCommitment({ id, name, allocatedBlocks }: Props) {
  return (
    <DeleteCommitmentButton
      name={name}
      allocatedBlocks={allocatedBlocks}
      onDelete={() => deleteCommitmentAction(id)}
    />
  );
}
