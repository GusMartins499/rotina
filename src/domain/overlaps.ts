import type { MinuteInterval } from "./time";

export function overlaps(a: MinuteInterval, b: MinuteInterval): boolean {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}
