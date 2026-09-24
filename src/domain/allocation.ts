import { FIRST_HOUR, LAST_HOUR, type HourInterval } from "./hours";
import { overlaps } from "./overlaps";

export type AllocationTarget = {
  commitment: { id: number; dailyHours: number | null };
  weekday: number;
  startHour: number;
  existing: (HourInterval & { weekday: number })[];
};

export type AllocationPlan =
  | { ok: true; startHour: number; endHour: number }
  | { ok: false; reason: "overlap" | "out-of-day" };

export function planAllocation(target: AllocationTarget): AllocationPlan {
  const duration = target.commitment.dailyHours ?? 1;
  const interval = { startHour: target.startHour, endHour: target.startHour + duration };

  if (interval.startHour < FIRST_HOUR || interval.endHour > LAST_HOUR) {
    return { ok: false, reason: "out-of-day" };
  }

  const sameDay = target.existing.filter((block) => block.weekday === target.weekday);
  if (sameDay.some((block) => overlaps(interval, block))) {
    return { ok: false, reason: "overlap" };
  }

  return { ok: true, ...interval };
}
