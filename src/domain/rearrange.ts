import { FIRST_HOUR, LAST_HOUR, durationOf } from "./hours";
import { overlaps } from "./overlaps";

export type PlacedInterval = {
  id: number | null;
  commitmentId: number;
  weekday: number;
  startHour: number;
  endHour: number;
};

export type RearrangePlan =
  | { ok: true; weekday: number; startHour: number; endHour: number }
  | { ok: false; reason: "overlap" | "out-of-day" | "empty" };

function settle(
  candidate: { weekday: number; startHour: number; endHour: number },
  moved: PlacedInterval,
  existing: PlacedInterval[],
): RearrangePlan {
  if (candidate.endHour <= candidate.startHour) {
    return { ok: false, reason: "empty" };
  }
  if (candidate.startHour < FIRST_HOUR || candidate.endHour > LAST_HOUR) {
    return { ok: false, reason: "out-of-day" };
  }

  const obstacles = existing.filter(
    (block) => block !== moved && block.weekday === candidate.weekday,
  );

  return obstacles.some((block) => overlaps(candidate, block))
    ? { ok: false, reason: "overlap" }
    : { ok: true, ...candidate };
}

export function planMove(
  block: PlacedInterval,
  target: { weekday: number; startHour: number },
  existing: PlacedInterval[],
): RearrangePlan {
  return settle(
    {
      weekday: target.weekday,
      startHour: target.startHour,
      endHour: target.startHour + durationOf(block),
    },
    block,
    existing,
  );
}

export function planResize(
  block: PlacedInterval,
  endHour: number,
  existing: PlacedInterval[],
): RearrangePlan {
  return settle(
    { weekday: block.weekday, startHour: block.startHour, endHour },
    block,
    existing,
  );
}
