"use client";

import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { formatDuration, intervalLabel } from "../../domain/time";
import { focusedDayOf } from "../../domain/week";
import type { Commitment } from "../../repository/schema";
import { SettingsDrawer } from "../commitments/SettingsDrawer";
import { withinGrid } from "./collision";
import { useNow } from "./NowProvider";
import { useSavingToast } from "./useSavingToast";
import { CommitmentDrawer } from "./CommitmentDrawer";
import { WeekGrid } from "./WeekGrid";
import { WeeklyLoadButton } from "./WeeklyLoadButton";
import { WeekSwitcher } from "./WeekSwitcher";
import { RoutineTemplate } from "./RoutineTemplate";
import {
  useAllocation,
  type AllocateResult,
  type PlacedBlock,
  type WriteResult,
} from "./useAllocation";

type Placement = { weekday: number; startMinute: number; endMinute: number };

type Focus = "current" | "next";

type Props = {
  weekLabel: string;
  focusedMonday: string;
  focus: Focus;
  today: string;
  saveTemplate: (focus: Focus) => Promise<WriteResult>;
  applyTemplate: (focus: Focus) => Promise<WriteResult>;
  commitments: Commitment[];
  allocatedBlocks: Record<number, number>;
  initialBlocks: PlacedBlock[];
  allocate: (input: Placement & { commitmentId: number; focus: Focus }) => Promise<AllocateResult>;
  move: (id: number, values: Placement) => Promise<WriteResult>;
  resize: (id: number, values: Placement) => Promise<WriteResult>;
  remove: (id: number) => Promise<WriteResult>;
};

type Dragged =
  | { kind: "commitment"; commitment: Commitment | undefined }
  | { kind: "block"; block: PlacedBlock; commitment: Commitment | undefined };

function parseSlot(id: string): { weekday: number; startMinute: number } | null {
  const match = /^slot-(\d+)-(\d+)$/.exec(id);
  return match === null ? null : { weekday: Number(match[1]), startMinute: Number(match[2]) };
}

function parseCommitment(id: string): number | null {
  const match = /^commitment-(\d+)$/.exec(id);
  return match === null ? null : Number(match[1]);
}

function hintOf(dragged: Dragged): string | null {
  if (dragged.kind === "block") {
    return intervalLabel(dragged.block);
  }

  const dailyMinutes = dragged.commitment?.dailyMinutes ?? null;
  return dailyMinutes === null ? null : `${formatDuration(dailyMinutes)}/dia`;
}

function DragChip({ dragged }: { dragged: Dragged }) {
  const hint = hintOf(dragged);

  return (
    <div
      className="drag-overlay"
      data-testid="drag-overlay"
      style={{ backgroundColor: dragged.commitment?.color }}
    >
      <span>{dragged.commitment?.name ?? "Compromisso"}</span>
      {hint !== null && <small>{hint}</small>}
    </div>
  );
}

function StackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="18" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function WeekBoard({
  weekLabel,
  focusedMonday,
  focus,
  today,
  commitments,
  allocatedBlocks,
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragged, setDragged] = useState<Dragged | null>(null);
  const byId = new Map(commitments.map((commitment) => [commitment.id, commitment]));
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function handleDragStart(event: DragStartEvent) {
    const block = event.active.data.current?.block as PlacedBlock | undefined;

    if (block !== undefined) {
      setDragged({ kind: "block", block, commitment: byId.get(block.commitmentId) });
      return;
    }

    const commitmentId = parseCommitment(String(event.active.id));
    if (commitmentId !== null) {
      setDragged({ kind: "commitment", commitment: byId.get(commitmentId) });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragging = dragged;
    setDragged(null);

    if (dragging?.kind === "commitment") {
      setDrawerOpen(false);
    }

    const block = event.active.data.current?.block as PlacedBlock | undefined;
    const slot = event.over === null ? null : parseSlot(String(event.over.id));

    if (block !== undefined) {
      if (slot === null) {
        void week.remove(block);
        return;
      }
      void week.move(block, slot);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      <div className="app">
        <header className="app-bar">
          <div className="app-bar-group">
            <button
              type="button"
              className="chip"
              data-testid="commitments-toggle"
              aria-expanded={drawerOpen}
              aria-controls="commitment-drawer"
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <StackIcon />
              Compromissos
            </button>
            <WeekSwitcher focus={focus} today={today} />
          </div>

          <h1 className="week-title">{weekLabel}</h1>

          <div className="app-bar-group">
            <WeeklyLoadButton commitments={commitments} blocks={week.blocks} />
            <SettingsDrawer commitments={commitments} allocatedBlocks={allocatedBlocks}>
              <RoutineTemplate
                onSave={() => saveTemplate(focus)}
                onApply={() => applyTemplate(focus)}
                canApply={week.blocks.length === 0}
              />
            </SettingsDrawer>
          </div>
        </header>

        <p
          aria-live="polite"
          role="status"
          data-testid="grid-announcement"
          className="announcement"
        >
          {week.announcement}
        </p>

        <main className="board">
          <WeekGrid
            blocks={week.blocks}
            commitments={commitments}
            onResize={(block, endMinute) => void week.resize(block, endMinute)}
            onRemove={(block) => void week.remove(block)}
            onMove={(block, to) => void week.move(block, to)}
            now={now}
            focusedMonday={focusedMonday}
          />
        </main>
      </div>

      <CommitmentDrawer
        commitments={commitments}
        blocks={week.blocks}
        focusedDay={focusedDayOf(now ?? today, focusedMonday)}
        open={drawerOpen}
        dragging={dragged?.kind === "commitment"}
        onClose={closeDrawer}
      />

      <DragOverlay dropAnimation={null}>
        {dragged === null ? null : <DragChip dragged={dragged} />}
      </DragOverlay>

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
