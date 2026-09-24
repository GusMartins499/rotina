"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  STEP_MINUTES,
  WEEKDAY_LABELS,
  timeLabel,
  wholeHoursOfDay,
} from "../../domain/time";
import { WEEKDAY_NAMES } from "../../domain/announce";
import { planResize } from "../../domain/rearrange";
import { nowMarker } from "../../domain/now";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useKeyboardCursor, type Cursor } from "./useKeyboardCursor";

type Props = {
  blocks: PlacedBlock[];
  commitments: Commitment[];
  onResize?: (block: PlacedBlock, endMinute: number) => void;
  onRemove?: (block: PlacedBlock) => void;
  onMove?: (block: PlacedBlock, to: { weekday: number; startMinute: number }) => void;
  now?: string | null;
  focusedMonday?: string;
};

type Preview = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  refused: boolean;
};

function rowOf(minute: number): number {
  return minute / MINUTES_PER_HOUR + 1;
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
  const targeted = cursor !== null && cursor.weekday === weekday && cursor.startMinute === hour;

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
  onPreview,
  siblings,
}: {
  block: PlacedBlock;
  commitment: Commitment | undefined;
  onResize?: (block: PlacedBlock, endMinute: number) => void;
  onRemove?: (block: PlacedBlock) => void;
  keyboard: KeyboardControls;
  onPreview: (preview: Preview | null) => void;
  siblings: PlacedBlock[];
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.weekday}-${block.startMinute}`,
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

    const hourHeight =
      (node.getBoundingClientRect().height / (block.endMinute - block.startMinute)) *
      MINUTES_PER_HOUR;
    const originY = event.clientY;
    let candidate = block.endMinute;

    function candidateFrom(clientY: number): number {
      return block.endMinute + Math.round((clientY - originY) / hourHeight) * MINUTES_PER_HOUR;
    }

    function move(event: PointerEvent) {
      candidate = candidateFrom(event.clientY);
      onPreview({
        weekday: block.weekday,
        startMinute: block.startMinute,
        endMinute: candidate,
        refused: !planResize(block, candidate, siblings).ok,
      });
    }

    function cancel() {
      stop();
      onPreview(null);
    }

    function finish() {
      stop();
      onPreview(null);
      if (candidate !== block.endMinute) {
        onResize?.(block, candidate);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        cancel();
      }
    }

    function stop() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("keydown", onKey);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("keydown", onKey);
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
      onResize?.(
        block,
        block.endMinute + (event.key === "ArrowDown" ? MINUTES_PER_HOUR : -MINUTES_PER_HOUR),
      );
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
      data-testid={`block-${block.weekday}-${block.startMinute}`}
      data-grabbed={grabbed ? "true" : undefined}
      aria-grabbed={grabbed}
      className="block"
      aria-label={`${commitment?.name ?? "Compromisso"}, ${WEEKDAY_NAMES[block.weekday]}, ${timeLabel(block.startMinute)} às ${timeLabel(block.endMinute)}`}
      style={{
        gridRow: `${rowOf(block.startMinute)} / ${rowOf(block.endMinute)}`,
        backgroundColor: commitment?.color,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <span>{commitment?.name}</span>
      <span
        data-testid={`resize-${block.weekday}-${block.startMinute}`}
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
  now = null,
  focusedMonday = "",
}: Props) {
  const { cursor, grab, release, nudge } = useKeyboardCursor();
  const [preview, setPreview] = useState<Preview | null>(null);
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
      if (cursor.weekday !== block.weekday || cursor.startMinute !== block.startMinute) {
        onMove?.(block, { weekday: cursor.weekday, startMinute: cursor.startMinute });
      }
    },
  };
  const hours = wholeHoursOfDay();
  const marker = now === null ? null : nowMarker(now, focusedMonday);
  const byId = new Map(commitments.map((commitment) => [commitment.id, commitment]));

  return (
    <div className="week-grid">
      <div className="hour-column">
        <div className="weekday-head" aria-hidden="true" />
        <div className="hour-labels">
          {hours.map((hour) => (
            <span key={hour} data-testid={`hour-label-${hour}`} className="hour-label">
              {timeLabel(hour)}
            </span>
          ))}
          <span className="hour-label hour-label-end">{timeLabel(MINUTES_PER_DAY)}</span>
        </div>
      </div>

      {WEEKDAY_LABELS.map((label, weekday) => (
        <div
          key={label}
          className="day-column"
          data-today={marker?.weekday === weekday ? "true" : undefined}
        >
          <div className="weekday-head" data-testid={`weekday-head-${weekday}`}>
            {label}
          </div>
          <div className="day-slots">
            {marker?.weekday === weekday && (
              <div
                data-testid="now-line"
                className="now-line"
                style={{ top: `calc(${marker.offsetMinutes / MINUTES_PER_HOUR} * var(--hour-height))` }}
              />
            )}
            {hours.map((hour) => (
              <Slot key={hour} weekday={weekday} hour={hour} cursor={cursor} />
            ))}
            {preview !== null && preview.weekday === weekday && (
              <div
                data-testid="resize-preview"
                data-refused={preview.refused ? "true" : "false"}
                className="resize-preview"
                style={{
                  gridRow: `${rowOf(preview.startMinute)} / ${rowOf(Math.max(preview.endMinute, preview.startMinute + STEP_MINUTES))}`,
                }}
              >
                <span>
                  {timeLabel(preview.startMinute)} às {timeLabel(preview.endMinute)}
                </span>
              </div>
            )}
            {blocks
              .filter((block) => block.weekday === weekday)
              .sort((a, b) => a.startMinute - b.startMinute)
              .map((block) => (
                <Block
                  key={`${block.weekday}-${block.startMinute}`}
                  block={block}
                  commitment={byId.get(block.commitmentId)}
                  onResize={onResize}
                  onRemove={onRemove}
                  keyboard={keyboard}
                  onPreview={setPreview}
                  siblings={blocks}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
