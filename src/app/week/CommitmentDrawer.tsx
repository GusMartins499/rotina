"use client";

import { useDraggable } from "@dnd-kit/core";
import { remainingFor } from "../../domain/load";
import { WEEKDAY_LABELS } from "../../domain/hours";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

type Props = {
  commitments: Commitment[];
  blocks: PlacedBlock[];
  focusedWeekday: number;
};

function describeRemainder(
  commitment: Commitment,
  weekday: number,
  blocks: PlacedBlock[],
): string | null {
  const remainder = remainingFor(commitment, weekday, blocks);

  if (remainder === null) {
    return null;
  }
  if (remainder.kind === "met") {
    return "dia completo";
  }
  if (remainder.kind === "exceeded") {
    return `excedeu em ${remainder.hours}h`;
  }
  return `faltam ${remainder.hours}h`;
}

function DraggableCommitment({
  commitment,
  remainder,
}: {
  commitment: Commitment;
  remainder: string | null;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `commitment-${commitment.id}`,
  });

  return (
    <li>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        data-testid={`drawer-commitment-${commitment.id}`}
        className="drawer-item"
        style={{ backgroundColor: commitment.color, opacity: isDragging ? 0.4 : 1 }}
      >
        <span>{commitment.name}</span>
        <small>{remainder ?? ""}</small>
      </div>
    </li>
  );
}

export function CommitmentDrawer({ commitments, blocks, focusedWeekday }: Props) {
  return (
    <aside className="drawer">
      <h2>Compromissos</h2>
      <p className="drawer-day">{WEEKDAY_LABELS[focusedWeekday]}</p>
      {commitments.length === 0 ? (
        <p>Nenhum compromisso cadastrado. Cadastre um para poder arrastar para a semana.</p>
      ) : (
        <ul>
          {commitments.map((commitment) => (
            <DraggableCommitment
              key={commitment.id}
              commitment={commitment}
              remainder={describeRemainder(commitment, focusedWeekday, blocks)}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
