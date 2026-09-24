"use client";

import { useState } from "react";
import { MINUTES_PER_DAY, MINUTES_PER_HOUR } from "../../domain/time";
import type { PlacedBlock } from "./useAllocation";

export type Cursor = {
  id: number | null;
  weekday: number;
  startMinute: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useKeyboardCursor() {
  const [cursor, setCursor] = useState<Cursor | null>(null);

  return {
    cursor,
    grab: (block: PlacedBlock) =>
      setCursor({ id: block.id, weekday: block.weekday, startMinute: block.startMinute }),
    release: () => setCursor(null),
    nudge: (weekdays: number, hours: number) =>
      setCursor((current) =>
        current === null
          ? null
          : {
              ...current,
              weekday: clamp(current.weekday + weekdays, 0, 6),
              startMinute: clamp(
                current.startMinute + hours * MINUTES_PER_HOUR,
                0,
                MINUTES_PER_DAY - MINUTES_PER_HOUR,
              ),
            },
      ),
  };
}
