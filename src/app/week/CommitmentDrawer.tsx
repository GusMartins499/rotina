"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Commitment } from "../../repository/schema";

type Props = {
  commitments: Commitment[];
};

function DraggableCommitment({ commitment }: { commitment: Commitment }) {
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
        {commitment.dailyHours !== null && <small>{commitment.dailyHours}h/dia</small>}
      </div>
    </li>
  );
}

export function CommitmentDrawer({ commitments }: Props) {
  return (
    <aside className="drawer">
      <h2>Compromissos</h2>
      {commitments.length === 0 ? (
        <p>Nenhum compromisso cadastrado. Cadastre um para poder arrastar para a semana.</p>
      ) : (
        <ul>
          {commitments.map((commitment) => (
            <DraggableCommitment key={commitment.id} commitment={commitment} />
          ))}
        </ul>
      )}
    </aside>
  );
}
