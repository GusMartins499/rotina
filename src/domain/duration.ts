import { MINUTES_PER_DAY, MINUTES_PER_HOUR, STEP_MINUTES } from "./time";

const HOURS_AND_MINUTES = /^(\d{1,2})\s*h\s*(\d{1,2})?$/i;
const MINUTES_ONLY = /^(\d{1,4})\s*min$/i;
const NUMBER = /^(\d{1,2})(?:[.,](\d{1,2}))?$/;

function fromParts(hours: number, minutes: number): number {
  return hours * MINUTES_PER_HOUR + minutes;
}

function validate(minutes: number): number | null {
  if (minutes <= 0 || minutes > MINUTES_PER_DAY || minutes % STEP_MINUTES !== 0) {
    return null;
  }
  return minutes;
}

export function parseDuration(text: string): number | null {
  const input = text.trim();

  const hoursAndMinutes = HOURS_AND_MINUTES.exec(input);
  if (hoursAndMinutes !== null) {
    return validate(fromParts(Number(hoursAndMinutes[1]), Number(hoursAndMinutes[2] ?? 0)));
  }

  const minutesOnly = MINUTES_ONLY.exec(input);
  if (minutesOnly !== null) {
    return validate(Number(minutesOnly[1]));
  }

  const asNumber = NUMBER.exec(input);
  if (asNumber !== null) {
    const hours = Number(`${asNumber[1]}.${asNumber[2] ?? 0}`);
    return validate(Math.round(hours * MINUTES_PER_HOUR));
  }

  return null;
}
