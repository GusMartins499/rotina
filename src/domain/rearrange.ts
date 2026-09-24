import { MINUTES_PER_DAY, durationOf } from "./time";
import { overlaps } from "./overlaps";

export type PlacedInterval = {
  id: number | null;
  commitmentId: number;
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export type RearrangePlan =
  | { ok: true; weekday: number; startMinute: number; endMinute: number }
  | { ok: false; reason: "overlap" | "out-of-day" | "empty" };

function settle(
  candidate: { weekday: number; startMinute: number; endMinute: number },
  moved: PlacedInterval,
  existing: PlacedInterval[],
): RearrangePlan {
  if (candidate.endMinute <= candidate.startMinute) {
    return { ok: false, reason: "empty" };
  }
  if (candidate.startMinute < 0 || candidate.endMinute > MINUTES_PER_DAY) {
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
  target: { weekday: number; startMinute: number },
  existing: PlacedInterval[],
): RearrangePlan {
  return settle(
    {
      weekday: target.weekday,
      startMinute: target.startMinute,
      endMinute: target.startMinute + durationOf(block),
    },
    block,
    existing,
  );
}

export function planResize(
  block: PlacedInterval,
  endMinute: number,
  existing: PlacedInterval[],
): RearrangePlan {
  return settle(
    { weekday: block.weekday, startMinute: block.startMinute, endMinute },
    block,
    existing,
  );
}
