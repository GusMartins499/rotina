"use client";

import { useDraggable } from "@dnd-kit/core";
import { useEffect, useRef } from "react";
import { formatDuration } from "../../domain/time";
import type { Commitment } from "../../repository/schema";

type Props = {
  commitments: Commitment[];
  open: boolean;
  dragging: boolean;
  onClose: () => void;
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
        style={{ backgroundColor: commitment.color, opacity: isDragging ? 0.3 : 1 }}
      >
        <span>{commitment.name}</span>
        {commitment.dailyMinutes !== null && (
          <small>{formatDuration(commitment.dailyMinutes)}/dia</small>
        )}
      </div>
    </li>
  );
}

export function CommitmentDrawer({ commitments, open, dragging, onClose }: Props) {
  const panel = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || dragging) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const onToggle = target.closest('[aria-controls="commitment-drawer"]') !== null;
      if (!onToggle && panel.current?.contains(target) === false) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, dragging, onClose]);

  return (
    <aside
      ref={panel}
      id="commitment-drawer"
      className="drawer"
      aria-label="Compromissos"
      data-open={open ? "true" : "false"}
      data-dragging={dragging ? "true" : undefined}
      inert={!open}
    >
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
      <p className="drawer-hint">Arraste para a semana. A gaveta se fecha sozinha ao soltar.</p>
    </aside>
  );
}
