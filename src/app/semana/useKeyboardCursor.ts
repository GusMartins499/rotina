"use client";

import { useState } from "react";
import { FIRST_HOUR, LAST_HOUR } from "../../domain/hours";
import type { PlacedBlock } from "./useAllocation";

export type Cursor = {
  id: number | null;
  weekday: number;
  startHour: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useKeyboardCursor() {
  const [cursor, setCursor] = useState<Cursor | null>(null);

  return {
    cursor,
    grab: (block: PlacedBlock) =>
      setCursor({ id: block.id, weekday: block.weekday, startHour: block.startHour }),
    release: () => setCursor(null),
    nudge: (weekdays: number, hours: number) =>
      setCursor((current) =>
        current === null
          ? null
          : {
              ...current,
              weekday: clamp(current.weekday + weekdays, 0, 6),
              startHour: clamp(current.startHour + hours, FIRST_HOUR, LAST_HOUR - 1),
            },
      ),
  };
}
