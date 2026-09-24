import { describe, it, expect } from "vitest";
import { overlaps } from "./overlaps";

describe("interval overlap", () => {
  it("detects overlap when the new interval starts inside an existing one", () => {
    expect(overlaps({ startHour: 8, endHour: 13 }, { startHour: 12, endHour: 14 })).toBe(true);
  });

  it("detects overlap when the new interval fully contains an existing one", () => {
    expect(overlaps({ startHour: 9, endHour: 11 }, { startHour: 8, endHour: 13 })).toBe(true);
  });

  it("treats touching intervals as non overlapping", () => {
    expect(overlaps({ startHour: 8, endHour: 13 }, { startHour: 13, endHour: 15 })).toBe(false);
  });

  it("is symmetric", () => {
    const pairs = [
      [{ startHour: 8, endHour: 13 }, { startHour: 12, endHour: 14 }],
      [{ startHour: 9, endHour: 11 }, { startHour: 8, endHour: 13 }],
      [{ startHour: 8, endHour: 13 }, { startHour: 13, endHour: 15 }],
    ] as const;

    for (const [a, b] of pairs) {
      expect(overlaps(a, b)).toBe(overlaps(b, a));
    }
  });
});
