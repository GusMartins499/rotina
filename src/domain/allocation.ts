import { MINUTES_PER_DAY, STEP_MINUTES, type MinuteInterval } from "./time";
import { overlaps } from "./overlaps";

export type AllocationTarget = {
  commitment: { id: number; dailyMinutes: number | null };
  weekday: number;
  startMinute: number;
  existing: (MinuteInterval & { weekday: number })[];
};

export type AllocationPlan =
  | { ok: true; startMinute: number; endMinute: number }
  | { ok: false; reason: "overlap" | "out-of-day" };

export function allocationSpan(
  commitment: { dailyMinutes: number | null },
  startMinute: number,
): MinuteInterval {
  return { startMinute, endMinute: startMinute + (commitment.dailyMinutes ?? STEP_MINUTES) };
}

export function planAllocation(target: AllocationTarget): AllocationPlan {
  const interval = allocationSpan(target.commitment, target.startMinute);

  if (interval.startMinute < 0 || interval.endMinute > MINUTES_PER_DAY) {
    return { ok: false, reason: "out-of-day" };
  }

  const sameDay = target.existing.filter((block) => block.weekday === target.weekday);
  if (sameDay.some((block) => overlaps(interval, block))) {
    return { ok: false, reason: "overlap" };
  }

  return { ok: true, ...interval };
}
