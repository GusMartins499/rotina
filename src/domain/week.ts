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
