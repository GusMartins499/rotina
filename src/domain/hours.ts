export const FIRST_HOUR = 6;
export const LAST_HOUR = 23;
export const HOURS_PER_DAY = LAST_HOUR - FIRST_HOUR;

export const WEEKDAYS = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export function isWithinDay(interval: HourInterval): boolean {
  return interval.startHour >= FIRST_HOUR && interval.endHour <= LAST_HOUR;
}

export type HourInterval = {
  startHour: number;
  endHour: number;
};

export function hasPositiveDuration(interval: HourInterval): boolean {
  return interval.endHour > interval.startHour;
}

export function durationOf(interval: HourInterval): number {
  return interval.endHour - interval.startHour;
}
