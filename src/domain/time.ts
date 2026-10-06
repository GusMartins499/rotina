export const FIRST_HOUR = 6;
export const LAST_HOUR = 23;
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = (LAST_HOUR - FIRST_HOUR) * MINUTES_PER_HOUR;
export const STEP_MINUTES = 30;

export type MinuteInterval = {
  startMinute: number;
  endMinute: number;
};

export function minutesOf(hour: number, minute = 0): number {
  return (hour - FIRST_HOUR) * MINUTES_PER_HOUR + minute;
}

export function timeLabel(minutesFromDayStart: number): string {
  const total = minutesFromDayStart + FIRST_HOUR * MINUTES_PER_HOUR;
  const hour = Math.floor(total / MINUTES_PER_HOUR);
  const minute = total % MINUTES_PER_HOUR;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function intervalLabel(interval: MinuteInterval): string {
  return `${timeLabel(interval.startMinute)}–${timeLabel(interval.endMinute)}`;
}

export function snapToStep(minutesFromDayStart: number): number {
  return Math.round(minutesFromDayStart / STEP_MINUTES) * STEP_MINUTES;
}

export function durationOf(interval: MinuteInterval): number {
  return interval.endMinute - interval.startMinute;
}

export function isWholeHour(minutesFromDayStart: number): boolean {
  return minutesFromDayStart % MINUTES_PER_HOUR === 0;
}

export function stepsOfDay(): number[] {
  return Array.from(
    { length: MINUTES_PER_DAY / STEP_MINUTES },
    (_, index) => index * STEP_MINUTES,
  );
}

export const WEEKDAY_LABELS = [
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
  "DOMINGO",
] as const;

export function wholeHoursOfDay(): number[] {
  return Array.from(
    { length: MINUTES_PER_DAY / MINUTES_PER_HOUR },
    (_, index) => index * MINUTES_PER_HOUR,
  );
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${rest}min`;
  }
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}
