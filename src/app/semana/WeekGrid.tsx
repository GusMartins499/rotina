"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  FIRST_HOUR,
  LAST_HOUR,
  WEEKDAY_LABELS,
  hourLabel,
  hoursOfDay,
} from "../../domain/hours";
import type { Commitment } from "../../repository/schema";
import type { PlacedBlock } from "./useAllocation";

type Props = {
  blocks: PlacedBlock[];
  commitments: Commitment[];
  onDropAt: (weekday: number, startHour: number) => void;
  activeCommitmentId: number | null;
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

export function WeekGrid({ blocks, commitments }: Props) {
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
          <div className="weekday-head">{label}</div>
          <div className="day-slots">
            {hours.map((hour) => (
              <Slot key={hour} weekday={weekday} hour={hour} />
            ))}
            {blocks
              .filter((block) => block.weekday === weekday)
              .map((block) => {
                const commitment = byId.get(block.commitmentId);
                return (
                  <div
                    key={`${block.weekday}-${block.startHour}`}
                    data-testid={`block-${block.weekday}-${block.startHour}`}
                    className="block"
                    aria-label={`${commitment?.name ?? "Compromisso"}, ${WEEKDAY_NAMES[weekday]}, ${hourLabel(block.startHour)} às ${hourLabel(block.endHour)}`}
                    style={{
                      gridRow: `${rowOf(block.startHour)} / ${rowOf(block.endHour)}`,
                      backgroundColor: commitment?.color,
                    }}
                  >
                    <span>{commitment?.name}</span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
