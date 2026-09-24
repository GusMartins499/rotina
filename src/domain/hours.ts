export const FIRST_HOUR = 6;
export const LAST_HOUR = 23;
export const HOURS_PER_DAY = LAST_HOUR - FIRST_HOUR;

export type HourInterval = {
  startHour: number;
  endHour: number;
};

export const WEEKDAY_LABELS = [
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
  "DOMINGO",
] as const;

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function hoursOfDay(): number[] {
  return Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, index) => FIRST_HOUR + index);
}
