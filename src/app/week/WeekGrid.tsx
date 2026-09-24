"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { FIRST_HOUR, LAST_HOUR, WEEKDAY_LABELS, hourLabel, hoursOfDay } from "../../domain/hours";
import { WEEKDAY_NAMES } from "../../domain/announce";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useKeyboardCursor, type Cursor } from "./useKeyboardCursor";

type Props = {
  blocks: PlacedBlock[];
  commitments: Commitment[];
  onResize?: (block: PlacedBlock, endHour: number) => void;
  onRemove?: (block: PlacedBlock) => void;
  onMove?: (block: PlacedBlock, to: { weekday: number; startHour: number }) => void;
};

function rowOf(hour: number): number {
  return hour - FIRST_HOUR + 1;
}

function Slot({
  weekday,
  hour,
  cursor,
}: {
  weekday: number;
  hour: number;
  cursor: Cursor | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${weekday}-${hour}` });
  const targeted = cursor !== null && cursor.weekday === weekday && cursor.startHour === hour;

  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${weekday}-${hour}`}
      data-over={isOver || targeted ? "true" : undefined}
      data-cursor={targeted ? "true" : undefined}
      className="slot"
      style={{ gridRow: `${rowOf(hour)} / ${rowOf(hour) + 1}` }}
    />
  );
}

function Block({
  block,
  commitment,
  onResize,
  onRemove,
  keyboard,
}: {
  block: PlacedBlock;
  commitment: Commitment | undefined;
  onResize?: (block: PlacedBlock, endHour: number) => void;
  onRemove?: (block: PlacedBlock) => void;
  keyboard: KeyboardControls;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.weekday}-${block.startHour}`,
    data: { block },
  });
  const element = useRef<HTMLDivElement | null>(null);

  function startResize(event: ReactPointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    const node = element.current;
    if (node === null || onResize === undefined) {
      return;
    }

    const hourHeight = node.getBoundingClientRect().height / (block.endHour - block.startHour);
    const originY = event.clientY;

    function finish(move: PointerEvent) {
      window.removeEventListener("pointerup", finish);
      const delta = Math.round((move.clientY - originY) / hourHeight);
      if (delta !== 0) {
        onResize?.(block, block.endHour + delta);
      }
    }

    window.addEventListener("pointerup", finish);
  }

  const grabbed = keyboard.cursor !== null && keyboard.cursor.id === block.id;

  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemove?.(block);
      return;
    }

    if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      event.stopPropagation();
      onResize?.(block, block.endHour + (event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      keyboard.toggle(block);
      return;
    }

    if (!grabbed) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      keyboard.release();
      return;
    }

    const nudges: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const nudge = nudges[event.key];

    if (nudge !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      keyboard.nudge(nudge[0], nudge[1]);
    }
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        element.current = node;
      }}
      onKeyDownCapture={handleKeyDown}
      {...listeners}
      {...attributes}
      data-testid={`block-${block.weekday}-${block.startHour}`}
      data-grabbed={grabbed ? "true" : undefined}
      aria-grabbed={grabbed}
      className="block"
      aria-label={`${commitment?.name ?? "Compromisso"}, ${WEEKDAY_NAMES[block.weekday]}, ${hourLabel(block.startHour)} às ${hourLabel(block.endHour)}`}
      style={{
        gridRow: `${rowOf(block.startHour)} / ${rowOf(block.endHour)}`,
        backgroundColor: commitment?.color,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <span>{commitment?.name}</span>
      <span
        data-testid={`resize-${block.weekday}-${block.startHour}`}
        className="resize-handle"
        onPointerDown={startResize}
      />
    </div>
  );
}

type KeyboardControls = {
  cursor: Cursor | null;
  toggle: (block: PlacedBlock) => void;
  release: () => void;
  nudge: (weekdays: number, hours: number) => void;
};

export function WeekGrid({
  blocks,
  commitments,
  onResize,
  onRemove,
  onMove,
}: Props) {
  const { cursor, grab, release, nudge } = useKeyboardCursor();
  const keyboard: KeyboardControls = {
    cursor,
    release,
    nudge,
    toggle: (block) => {
      if (cursor === null) {
        grab(block);
        return;
      }
      release();
      if (cursor.weekday !== block.weekday || cursor.startHour !== block.startHour) {
        onMove?.(block, { weekday: cursor.weekday, startHour: cursor.startHour });
      }
    },
  };
  const hours = hoursOfDay();
  const byId = new Map(commitments.map((commitment) => [commitment.id, commitment]));

  return (
    <div className="week-grid">
      <div className="hour-column">
        <div className="weekday-head" aria-hidden="true" />
        <div className="hour-labels">
          {hours.map((hour) => (
            <span key={hour} data-testid={`hour-label-${hour}`} className="hour-label">
              {hourLabel(hour)}
            </span>
          ))}
          <span className="hour-label hour-label-end">{hourLabel(LAST_HOUR)}</span>
        </div>
      </div>

      {WEEKDAY_LABELS.map((label, weekday) => (
        <div key={label} className="day-column">
          <div className="weekday-head" data-testid={`weekday-head-${weekday}`}>
            {label}
          </div>
          <div className="day-slots">
            {hours.map((hour) => (
              <Slot key={hour} weekday={weekday} hour={hour} cursor={cursor} />
            ))}
            {blocks
              .filter((block) => block.weekday === weekday)
              .sort((a, b) => a.startHour - b.startHour)
              .map((block) => (
                <Block
                  key={`${block.weekday}-${block.startHour}`}
                  block={block}
                  commitment={byId.get(block.commitmentId)}
                  onResize={onResize}
                  onRemove={onRemove}
                  keyboard={keyboard}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
