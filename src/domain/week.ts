const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function weekdayIndexOf(isoDate: string): number {
  const sundayBased = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return (sundayBased + 6) % 7;
}

export function mondayOf(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const monday = new Date(date.getTime() - weekdayIndexOf(isoDate) * MILLISECONDS_PER_DAY);
  return monday.toISOString().slice(0, 10);
}

export function nextMonday(mondayDate: string): string {
  const monday = new Date(`${mondayDate}T00:00:00Z`);
  return new Date(monday.getTime() + 7 * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
}

export type FocusedDay = { weekday: number; isToday: boolean };

export function focusedDayOf(todayIso: string, focusedMonday: string): FocusedDay {
  const date = todayIso.slice(0, 10);

  if (mondayOf(date) === focusedMonday) {
    return { weekday: weekdayIndexOf(date), isToday: true };
  }
  return { weekday: 0, isToday: false };
}

export function datesOfWeek(mondayDate: string): number[] {
  const monday = new Date(`${mondayDate}T00:00:00Z`).getTime();

  return Array.from({ length: 7 }, (_, index) =>
    new Date(monday + index * MILLISECONDS_PER_DAY).getUTCDate(),
  );
}
