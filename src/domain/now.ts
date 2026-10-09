import {
  FIRST_HOUR,
  LAST_HOUR,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  type MinuteInterval,
} from "./time";
import { mondayOf, weekdayIndexOf } from "./week";

export type NowMarker = {
  weekday: number;
  offsetMinutes: number;
};

export function nowMarker(nowIso: string, focusedMonday: string): NowMarker | null {
  const date = nowIso.slice(0, 10);

  if (mondayOf(date) !== focusedMonday) {
    return null;
  }

  const hours = Number(nowIso.slice(11, 13));
  const minutes = Number(nowIso.slice(14, 16));
  const offsetMinutes = (hours - FIRST_HOUR) * MINUTES_PER_HOUR + minutes;

  if (offsetMinutes < 0 || hours >= LAST_HOUR) {
    return null;
  }

  return { weekday: weekdayIndexOf(date), offsetMinutes };
}

export type PastBoundary = {
  weekday: number;
  minute: number;
};

const DAYS_PER_WEEK = 7;

export function pastBoundary(nowIso: string, focusedMonday: string): PastBoundary {
  const date = nowIso.slice(0, 10);
  const currentMonday = mondayOf(date);

  if (focusedMonday > currentMonday) {
    return { weekday: 0, minute: 0 };
  }
  if (focusedMonday < currentMonday) {
    return { weekday: DAYS_PER_WEEK, minute: 0 };
  }

  const hours = Number(nowIso.slice(11, 13));
  const minutes = Number(nowIso.slice(14, 16));
  const elapsed = (hours - FIRST_HOUR) * MINUTES_PER_HOUR + minutes;

  return {
    weekday: weekdayIndexOf(date),
    minute: Math.min(Math.max(elapsed, 0), MINUTES_PER_DAY),
  };
}

export function isDayPast(boundary: PastBoundary | null, weekday: number): boolean {
  return boundary !== null && weekday < boundary.weekday;
}

export function isMinutePast(
  boundary: PastBoundary | null,
  weekday: number,
  minute: number,
): boolean {
  if (boundary === null) {
    return false;
  }
  return weekday < boundary.weekday || (weekday === boundary.weekday && minute < boundary.minute);
}

export function isIntervalPast(
  boundary: PastBoundary | null,
  weekday: number,
  interval: MinuteInterval,
): boolean {
  if (boundary === null) {
    return false;
  }
  return (
    weekday < boundary.weekday ||
    (weekday === boundary.weekday && interval.endMinute <= boundary.minute)
  );
}
