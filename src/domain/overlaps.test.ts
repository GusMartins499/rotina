import { describe, it, expect } from "vitest";
import { overlaps } from "./overlaps";

describe("interval overlap", () => {
  it("detects overlap when the new interval starts inside an existing one", () => {
    expect(overlaps({ startMinute: 120, endMinute: 420 }, { startMinute: 360, endMinute: 480 })).toBe(true);
  });

  it("detects overlap when the new interval fully contains an existing one", () => {
    expect(overlaps({ startMinute: 180, endMinute: 300 }, { startMinute: 120, endMinute: 420 })).toBe(true);
  });

  it("treats touching intervals as non overlapping", () => {
    expect(overlaps({ startMinute: 120, endMinute: 420 }, { startMinute: 420, endMinute: 540 })).toBe(false);
  });

  it("detects overlap between half hour intervals", () => {
    expect(overlaps({ startMinute: 120, endMinute: 150 }, { startMinute: 135, endMinute: 165 })).toBe(true);
  });

  it("treats touching half hours as non overlapping", () => {
    expect(overlaps({ startMinute: 120, endMinute: 150 }, { startMinute: 150, endMinute: 180 })).toBe(false);
  });

  it("is symmetric", () => {
    const pairs = [
      [{ startMinute: 120, endMinute: 420 }, { startMinute: 360, endMinute: 480 }],
      [{ startMinute: 180, endMinute: 300 }, { startMinute: 120, endMinute: 420 }],
      [{ startMinute: 120, endMinute: 420 }, { startMinute: 420, endMinute: 540 }],
    ] as const;

    for (const [a, b] of pairs) {
      expect(overlaps(a, b)).toBe(overlaps(b, a));
    }
  });
});
