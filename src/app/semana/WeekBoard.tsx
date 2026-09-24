"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import type { Commitment } from "../../repository/schema";
import { CommitmentDrawer } from "./CommitmentDrawer";
import { WeekGrid } from "./WeekGrid";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";
import {
  useAllocation,
  type AllocateResult,
  type PlacedBlock,
  type WriteResult,
} from "./useAllocation";

type Placement = { weekday: number; startHour: number; endHour: number };

type Props = {
  weekLabel: string;
  commitments: Commitment[];
  initialBlocks: PlacedBlock[];
  allocate: (input: Placement & { commitmentId: number }) => Promise<AllocateResult>;
  move: (id: number, values: Placement) => Promise<WriteResult>;
  resize: (id: number, values: Placement) => Promise<WriteResult>;
  remove: (id: number) => Promise<WriteResult>;
};

function parseSlot(id: string): { weekday: number; startHour: number } | null {
  const match = /^slot-(\d+)-(\d+)$/.exec(id);
  return match === null ? null : { weekday: Number(match[1]), startHour: Number(match[2]) };
}

function parseCommitment(id: string): number | null {
  const match = /^commitment-(\d+)$/.exec(id);
  return match === null ? null : Number(match[1]);
}

export function WeekBoard({ weekLabel, commitments, initialBlocks, ...persistence }: Props) {
  const week = useAllocation({ initialBlocks, commitments, ...persistence });
  const [focusedWeekday, setFocusedWeekday] = useState(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const dragged = event.active.data.current?.block as PlacedBlock | undefined;
    const slot = event.over === null ? null : parseSlot(String(event.over.id));

    if (dragged !== undefined) {
      if (slot === null) {
        void week.remove(dragged);
        return;
      }
      void week.move(dragged, slot);
      return;
    }

    const commitmentId = parseCommitment(String(event.active.id));
    if (slot !== null && commitmentId !== null) {
      void week.allocate({ commitmentId, ...slot });
    }
  }

  return (
    <DndContext id="week-board" sensors={sensors} onDragEnd={handleDragEnd}>
      <header className="week-header">
        <h1>{weekLabel}</h1>
        <p aria-live="polite" className="saving">
          {week.saving ? "Salvando…" : ""}
        </p>
        {week.error !== null && (
          <p role="alert" data-testid="board-error">
            {week.error}
          </p>
        )}
      </header>

      <div className="board">
        <WeekGrid
          blocks={week.blocks}
          commitments={commitments}
          onResize={(block, endHour) => void week.resize(block, endHour)}
          onFocusWeekday={setFocusedWeekday}
        />
        <div className="side">
          <CommitmentDrawer
            commitments={commitments}
            blocks={week.blocks}
            focusedWeekday={focusedWeekday}
          />
          <WeeklyLoadPanel commitments={commitments} blocks={week.blocks} />
        </div>
      </div>
    </DndContext>
  );
}
