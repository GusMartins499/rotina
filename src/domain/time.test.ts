import { describe, it, expect } from "vitest";
import {
  MINUTES_PER_DAY,
  isWholeHour,
  minutesOf,
  formatDuration,
  intervalLabel,
  snapToStep,
  stepsOfDay,
  timeLabel,
} from "./time";

describe("interval label", () => {
  it("joins the start and the end of an interval", () => {
    expect(intervalLabel({ startMinute: 120, endMinute: 420 })).toBe("08:00\u201313:00");
  });

  it("keeps the half hour visible on both ends", () => {
    expect(intervalLabel({ startMinute: 150, endMinute: 510 })).toBe("08:30\u201314:30");
  });
});

describe("minute conversion", () => {
  it("converts a whole hour to minutes from the day start", () => {
    expect(minutesOf(8)).toBe(120);
  });

  it("converts an hour with minutes", () => {
    expect(minutesOf(8, 30)).toBe(150);
  });

  it("starts the day at zero", () => {
    expect(minutesOf(6)).toBe(0);
  });

  it("formats a whole hour", () => {
    expect(timeLabel(120)).toBe("08:00");
  });

  it("formats a half hour", () => {
    expect(timeLabel(150)).toBe("08:30");
  });

  it("formats the closing time of the day", () => {
    expect(timeLabel(MINUTES_PER_DAY)).toBe("23:00");
  });

  it("formats the opening time of the day", () => {
    expect(timeLabel(0)).toBe("06:00");
  });

  it("snaps a position to the nearest step", () => {
    expect(snapToStep(137)).toBe(150);
  });

  it("snaps downwards when closer to the previous step", () => {
    expect(snapToStep(134)).toBe(120);
  });

  it("keeps a value already on the step", () => {
    expect(snapToStep(150)).toBe(150);
  });

  it("recognises a whole hour", () => {
    expect(isWholeHour(120)).toBe(true);
  });

  it("recognises a half hour as not whole", () => {
    expect(isWholeHour(150)).toBe(false);
  });

  it("formats a duration of whole hours", () => {
    expect(formatDuration(480)).toBe("8h");
  });

  it("formats a duration with minutes", () => {
    expect(formatDuration(90)).toBe("1h30");
  });

  it("formats a duration under an hour", () => {
    expect(formatDuration(30)).toBe("30min");
  });

  it("lists every step of the day", () => {
    const steps = stepsOfDay();

    expect(steps).toHaveLength(34);
    expect(steps[0]).toBe(0);
    expect(steps.at(-1)).toBe(MINUTES_PER_DAY - 30);
  });
});
