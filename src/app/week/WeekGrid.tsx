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
  STEP_MINUTES,
  WEEKDAY_LABELS,
  timeLabel,
  intervalLabel,
  durationOf,
  isWholeHour,
  stepsOfDay,
} from "../../domain/time";
import { WEEKDAY_NAMES } from "../../domain/announce";
import { planResize } from "../../domain/rearrange";
import { nowMarker } from "../../domain/now";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";
import { useKeyboardCursor, type Cursor } from "./useKeyboardCursor";
import type { Preview } from "./placementPreview";

type Props = {
  blocks: PlacedBlock[];
  commitments: Commitment[];
  onResize?: (block: PlacedBlock, endMinute: number) => void;
  onRemove?: (block: PlacedBlock) => void;
  onMove?: (block: PlacedBlock, to: { weekday: number; startMinute: number }) => void;
  now?: string | null;
  focusedMonday?: string;
  dropPreview?: Preview | null;
};

function rowOf(minute: number): number {
  return minute / STEP_MINUTES + 1;
}

function Slot({
  weekday,
  minute,
  cursor,
}: {
  weekday: number;
  minute: number;
  cursor: Cursor | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${weekday}-${minute}` });
  const targeted = cursor !== null && cursor.weekday === weekday && cursor.startMinute === minute;

  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${weekday}-${minute}`}
      data-half={isWholeHour(minute) ? undefined : "true"}
      data-over={isOver || targeted ? "true" : undefined}
      data-cursor={targeted ? "true" : undefined}
      className="slot"
      style={{ gridRow: `${rowOf(minute)} / ${rowOf(minute) + 1}` }}
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
    const slot = node?.parentElement?.querySelector(".slot") ?? null;
    if (node === null || slot === null || onResize === undefined) {
      return;
    }

    const stepHeight = slot.getBoundingClientRect().height;
    const originY = event.clientY;
    let candidate = block.endMinute;

    function candidateFrom(clientY: number): number {
      return block.endMinute + Math.round((clientY - originY) / stepHeight) * STEP_MINUTES;
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
        block.endMinute + (event.key === "ArrowDown" ? STEP_MINUTES : -STEP_MINUTES),
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
      data-compact={durationOf(block) <= STEP_MINUTES ? "true" : undefined}
      aria-grabbed={grabbed}
      className="block"
      aria-label={`${commitment?.name ?? "Compromisso"}, ${WEEKDAY_NAMES[block.weekday]}, ${timeLabel(block.startMinute)} às ${timeLabel(block.endMinute)}`}
      style={{
        gridRow: `${rowOf(block.startMinute)} / ${rowOf(block.endMinute)}`,
        backgroundColor: commitment?.color,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <span className="block-name">{commitment?.name}</span>
      <span className="block-time">{intervalLabel(block)}</span>
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
  dropPreview = null,
}: Props) {
  const { cursor, grab, release, nudge } = useKeyboardCursor();
  const [resizePreview, setResizePreview] = useState<Preview | null>(null);
  const preview = resizePreview ?? dropPreview;
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
  const steps = stepsOfDay();
  const marker = now === null ? null : nowMarker(now, focusedMonday);
  const byId = new Map(commitments.map((commitment) => [commitment.id, commitment]));

  return (
    <div className="week-grid">
      <div className="hour-column">
        <div className="weekday-head" aria-hidden="true" />
        <div className="hour-labels">
          {steps.map((minute) => (
            <span
              key={minute}
              data-testid={isWholeHour(minute) ? `hour-label-${minute}` : undefined}
              className={isWholeHour(minute) ? "hour-label" : "hour-label hour-label-half"}
            >
              {timeLabel(minute)}
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
                style={{ top: `calc(${marker.offsetMinutes / STEP_MINUTES} * var(--step-height))` }}
              />
            )}
            {steps.map((minute) => (
              <Slot key={minute} weekday={weekday} minute={minute} cursor={cursor} />
            ))}
            {preview !== null && preview.weekday === weekday && (
              <div
                data-testid={resizePreview === null ? "drop-preview" : "resize-preview"}
                data-refused={preview.refused ? "true" : "false"}
                className="placement-preview"
                style={{
                  gridRow: `${rowOf(preview.startMinute)} / ${rowOf(Math.min(Math.max(preview.endMinute, preview.startMinute + STEP_MINUTES), MINUTES_PER_DAY))}`,
                }}
              >
                <span>
                  {timeLabel(preview.startMinute)} às{" "}
                  {timeLabel(Math.min(preview.endMinute, MINUTES_PER_DAY))}
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
                  onPreview={setResizePreview}
                  siblings={blocks}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
