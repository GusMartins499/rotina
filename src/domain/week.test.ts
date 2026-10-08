import { describe, it, expect } from "vitest";
import { focusedDayOf, mondayOf, weekdayIndexOf } from "./week";

describe("monday of a week", () => {
  it("returns the same date when it is already a monday", () => {
    expect(mondayOf("2026-09-21")).toBe("2026-09-21");
  });

  it("returns the monday that starts the week of a wednesday", () => {
    expect(mondayOf("2026-09-23")).toBe("2026-09-21");
  });

  it("treats sunday as the last day of the week it closes", () => {
    expect(mondayOf("2026-09-27")).toBe("2026-09-21");
  });

  it("crosses a month boundary", () => {
    expect(mondayOf("2026-10-01")).toBe("2026-09-28");
  });

  it("crosses a year boundary", () => {
    expect(mondayOf("2027-01-01")).toBe("2026-12-28");
  });
});

describe("weekday index", () => {
  it("maps monday to zero", () => {
    expect(weekdayIndexOf("2026-09-21")).toBe(0);
  });

  it("maps sunday to six", () => {
    expect(weekdayIndexOf("2026-09-27")).toBe(6);
  });
});

describe("focused day", () => {
  it("focuses today while the current week is in focus", () => {
    expect(focusedDayOf("2026-09-23T10:15", "2026-09-21")).toEqual({
      weekday: 2,
      isToday: true,
    });
  });

  it("focuses monday while the next week is in focus", () => {
    expect(focusedDayOf("2026-09-23", "2026-09-28")).toEqual({ weekday: 0, isToday: false });
  });

  it("keeps sunday inside the week it closes", () => {
    expect(focusedDayOf("2026-09-27", "2026-09-21")).toEqual({ weekday: 6, isToday: true });
  });
});
