import { describe, it, expect } from "vitest";
import { nowMarker } from "./now";

describe("now marker", () => {
  it("places the marker on the current weekday and hour fraction", () => {
    expect(nowMarker("2026-09-23T10:30:00", "2026-09-21")).toEqual({
      weekday: 2,
      offsetHours: 4.5,
    });
  });

  it("places the marker at the start of the day window", () => {
    expect(nowMarker("2026-09-21T06:00:00", "2026-09-21")).toEqual({
      weekday: 0,
      offsetHours: 0,
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
      offsetHours: 14,
    });
  });
});
