import { describe, it, expect } from "vitest";
import { isDayPast, isIntervalPast, isMinutePast, nowMarker, pastBoundary } from "./now";

describe("now marker", () => {
  it("places the marker on the current weekday and minute offset", () => {
    expect(nowMarker("2026-09-23T10:30:00", "2026-09-21")).toEqual({
      weekday: 2,
      offsetMinutes: 270,
    });
  });

  it("places the marker at the start of the day window", () => {
    expect(nowMarker("2026-09-21T06:00:00", "2026-09-21")).toEqual({
      weekday: 0,
      offsetMinutes: 0,
    });
  });

  it("hides the marker before the day window opens", () => {
    expect(nowMarker("2026-09-21T05:30:00", "2026-09-21")).toBeNull();
  });

  it("hides the marker after the day window closes", () => {
    expect(nowMarker("2026-09-21T23:30:00", "2026-09-21")).toBeNull();
  });

  it("hides the marker when the week in focus is not the current one", () => {
    expect(nowMarker("2026-09-23T10:00:00", "2026-09-28")).toBeNull();
  });

  it("places the marker on sunday, the last column", () => {
    expect(nowMarker("2026-09-27T20:00:00", "2026-09-21")).toEqual({
      weekday: 6,
      offsetMinutes: 840,
    });
  });
});

describe("past boundary", () => {
  it("puts the boundary on today at the elapsed minute", () => {
    expect(pastBoundary("2026-09-23T14:00", "2026-09-21")).toEqual({
      weekday: 2,
      minute: 480,
    });
  });

  it("marks the days before today as past", () => {
    const boundary = pastBoundary("2026-09-23T14:00", "2026-09-21");

    expect(isDayPast(boundary, 0)).toBe(true);
    expect(isDayPast(boundary, 1)).toBe(true);
    expect(isDayPast(boundary, 2)).toBe(false);
  });

  it("keeps the days before today past after the day window closes", () => {
    const boundary = pastBoundary("2026-09-23T23:40", "2026-09-21");

    expect(isDayPast(boundary, 1)).toBe(true);
    expect(isMinutePast(boundary, 2, 990)).toBe(true);
  });

  it("marks nothing of today as past before the day window opens", () => {
    expect(isMinutePast(pastBoundary("2026-09-23T05:30", "2026-09-21"), 2, 0)).toBe(false);
  });

  it("marks the slots before now as past on today", () => {
    const boundary = pastBoundary("2026-09-23T14:00", "2026-09-21");

    expect(isMinutePast(boundary, 2, 180)).toBe(true);
    expect(isMinutePast(boundary, 2, 600)).toBe(false);
  });

  it("marks no day as past on the next week", () => {
    const boundary = pastBoundary("2026-09-27T20:00", "2026-09-28");

    expect(isDayPast(boundary, 6)).toBe(false);
    expect(isMinutePast(boundary, 0, 0)).toBe(false);
  });

  it("marks the whole week as past once it is behind", () => {
    expect(isDayPast(pastBoundary("2026-09-28T08:00", "2026-09-21"), 6)).toBe(true);
  });

  it("treats a block as past only once it has ended", () => {
    const boundary = pastBoundary("2026-09-23T14:00", "2026-09-21");

    expect(isIntervalPast(boundary, 2, { startMinute: 300, endMinute: 480 })).toBe(true);
    expect(isIntervalPast(boundary, 2, { startMinute: 420, endMinute: 540 })).toBe(false);
    expect(isIntervalPast(boundary, 0, { startMinute: 900, endMinute: 960 })).toBe(true);
  });

  it("marks nothing as past without a clock", () => {
    expect(isDayPast(null, 0)).toBe(false);
    expect(isMinutePast(null, 0, 0)).toBe(false);
    expect(isIntervalPast(null, 0, { startMinute: 0, endMinute: 30 })).toBe(false);
  });
});
