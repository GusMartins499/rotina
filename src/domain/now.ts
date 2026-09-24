import { FIRST_HOUR, LAST_HOUR } from "./hours";
import { mondayOf, weekdayIndexOf } from "./week";

export type NowMarker = {
  weekday: number;
  offsetHours: number;
};

export function nowMarker(nowIso: string, focusedMonday: string): NowMarker | null {
  const date = nowIso.slice(0, 10);

  if (mondayOf(date) !== focusedMonday) {
    return null;
  }

  const hours = Number(nowIso.slice(11, 13));
  const minutes = Number(nowIso.slice(14, 16));
  const offsetHours = hours + minutes / 60 - FIRST_HOUR;

  if (offsetHours < 0 || hours >= LAST_HOUR) {
    return null;
  }

  return { weekday: weekdayIndexOf(date), offsetHours };
}
