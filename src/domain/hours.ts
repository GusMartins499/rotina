export const FIRST_HOUR = 6;
export const LAST_HOUR = 23;
export const HOURS_PER_DAY = LAST_HOUR - FIRST_HOUR;

export type HourInterval = {
  startHour: number;
  endHour: number;
};
