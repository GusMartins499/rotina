"use client";

import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Commitment } from "../../repository/schema";
import { withinGrid } from "./collision";
import { useNow } from "./NowProvider";
import { useSavingToast } from "./useSavingToast";
import { CommitmentDrawer } from "./CommitmentDrawer";
import { WeekGrid } from "./WeekGrid";
import { WeeklyLoadPanel } from "./WeeklyLoadPanel";
import { RoutineTemplate } from "./RoutineTemplate";
import {
  useAllocation,
  type AllocateResult,
  type PlacedBlock,
  type WriteResult,
} from "./useAllocation";

type Placement = { weekday: number; startHour: number; endHour: number };

type Focus = "current" | "next";

type Props = {
  weekLabel: string;
  focusedMonday: string;
  focus: Focus;
  saveTemplate: (focus: Focus) => Promise<WriteResult>;
  applyTemplate: (focus: Focus) => Promise<WriteResult>;
  commitments: Commitment[];
  initialBlocks: PlacedBlock[];
  allocate: (input: Placement & { commitmentId: number; focus: Focus }) => Promise<AllocateResult>;
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

export function WeekBoard({
  weekLabel,
  focusedMonday,
  focus,
  commitments,
  initialBlocks,
  allocate,
  move,
  resize,
  remove,
  saveTemplate,
  applyTemplate,
}: Props) {
  const week = useAllocation({
    initialBlocks,
    commitments,
    allocate: (input) => allocate({ ...input, focus }),
    move,
    resize,
    remove,
  });
  const now = useNow();
  const toast = useSavingToast(week.saving, week.error);
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
    <DndContext
      id="week-board"
      sensors={sensors}
      collisionDetection={withinGrid}
      autoScroll={false}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragEnd={handleDragEnd}
    >
      <header className="week-header">
        <h1>{weekLabel}</h1>
        <p
          aria-live="polite"
          role="status"
          data-testid="grid-announcement"
          className="announcement"
        >
          {week.announcement}
        </p>
      </header>

      <div className="board">
        <WeekGrid
          blocks={week.blocks}
          commitments={commitments}
          onResize={(block, endHour) => void week.resize(block, endHour)}
          onRemove={(block) => void week.remove(block)}
          onMove={(block, to) => void week.move(block, to)}
          now={now}
          focusedMonday={focusedMonday}
        />
        <div className="side">
          <CommitmentDrawer commitments={commitments} />
          <WeeklyLoadPanel commitments={commitments} blocks={week.blocks} />
          <RoutineTemplate
            onSave={() => saveTemplate(focus)}
            onApply={() => applyTemplate(focus)}
            canApply={week.blocks.length === 0}
          />
        </div>
      </div>
      {toast !== null && (
        <output
          aria-live="polite"
          data-testid="saving-toast"
          data-state={toast.state}
          className="toast"
        >
          {toast.message}
        </output>
      )}
      {week.error !== null && (
        <p role="alert" data-testid="board-error" className="visually-hidden">
          {week.error}
        </p>
      )}
    </DndContext>
  );
}
