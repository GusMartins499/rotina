import type { HourInterval } from "./hours";

export function overlaps(a: HourInterval, b: HourInterval): boolean {
  return a.startHour < b.endHour && b.startHour < a.endHour;
}
