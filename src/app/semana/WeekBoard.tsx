"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import type { Commitment } from "../../repository/schema";
import { CommitmentDrawer } from "./CommitmentDrawer";
import { WeekGrid } from "./WeekGrid";
import { useAllocation, type AllocateResult, type PlacedBlock } from "./useAllocation";

type Props = {
  weekLabel: string;
  commitments: Commitment[];
  initialBlocks: PlacedBlock[];
  allocate: (input: {
    commitmentId: number;
    weekday: number;
    startHour: number;
    endHour: number;
  }) => Promise<AllocateResult>;
};

function parseSlot(id: string): { weekday: number; startHour: number } | null {
  const match = /^slot-(\d+)-(\d+)$/.exec(id);
  return match === null
    ? null
    : { weekday: Number(match[1]), startHour: Number(match[2]) };
}

function parseCommitment(id: string): number | null {
  const match = /^commitment-(\d+)$/.exec(id);
  return match === null ? null : Number(match[1]);
}

export function WeekBoard({ weekLabel, commitments, initialBlocks, allocate }: Props) {
  const { blocks, saving, error, allocate: place } = useAllocation({
    initialBlocks,
    commitments,
    allocate,
  });
  const [activeCommitmentId, setActiveCommitmentId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    setActiveCommitmentId(null);

    const slot = event.over === null ? null : parseSlot(String(event.over.id));
    const commitmentId = parseCommitment(String(event.active.id));
    if (slot === null || commitmentId === null) {
      return;
    }

    void place({ commitmentId, ...slot });
  }

  return (
    <DndContext
      id="week-board"
      sensors={sensors}
      onDragStart={(event) => setActiveCommitmentId(parseCommitment(String(event.active.id)))}
      onDragEnd={handleDragEnd}
    >
      <header className="week-header">
        <h1>{weekLabel}</h1>
        <p aria-live="polite" className="saving">
          {saving ? "Salvando…" : ""}
        </p>
        {error !== null && (
          <p role="alert" data-testid="board-error">
            {error}
          </p>
        )}
      </header>

      <div className="board">
        <WeekGrid
          blocks={blocks}
          commitments={commitments}
          onDropAt={(weekday, startHour) =>
            activeCommitmentId === null
              ? undefined
              : void place({ commitmentId: activeCommitmentId, weekday, startHour })
          }
          activeCommitmentId={activeCommitmentId}
        />
        <CommitmentDrawer commitments={commitments} />
      </div>
    </DndContext>
  );
}
