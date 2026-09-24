"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { FIRST_HOUR, LAST_HOUR, WEEKDAY_LABELS, hourLabel, hoursOfDay } from "../../domain/hours";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

type Props = {
  blocks: PlacedBlock[];
  commitments: Commitment[];
  onResize?: (block: PlacedBlock, endHour: number) => void;
  onFocusWeekday?: (weekday: number) => void;
};

const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

function rowOf(hour: number): number {
  return hour - FIRST_HOUR + 1;
}

function Slot({ weekday, hour }: { weekday: number; hour: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${weekday}-${hour}` });

  return (
    <div
      ref={setNodeRef}
      data-testid={`slot-${weekday}-${hour}`}
      data-over={isOver ? "true" : undefined}
      className="slot"
      style={{ gridRow: `${rowOf(hour)} / ${rowOf(hour) + 1}` }}
    />
  );
}

function Block({
  block,
  commitment,
  onResize,
}: {
  block: PlacedBlock;
  commitment: Commitment | undefined;
  onResize?: (block: PlacedBlock, endHour: number) => void;
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

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        element.current = node;
      }}
      {...listeners}
      {...attributes}
      data-testid={`block-${block.weekday}-${block.startHour}`}
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

export function WeekGrid({ blocks, commitments, onResize, onFocusWeekday }: Props) {
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
        <div
          key={label}
          className="day-column"
          onPointerEnter={() => onFocusWeekday?.(weekday)}
        >
          <div className="weekday-head" data-testid={`weekday-head-${weekday}`}>
            {label}
          </div>
          <div className="day-slots">
            {hours.map((hour) => (
              <Slot key={hour} weekday={weekday} hour={hour} />
            ))}
            {blocks
              .filter((block) => block.weekday === weekday)
              .map((block) => (
                <Block
                  key={`${block.weekday}-${block.startHour}`}
                  block={block}
                  commitment={byId.get(block.commitmentId)}
                  onResize={onResize}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
