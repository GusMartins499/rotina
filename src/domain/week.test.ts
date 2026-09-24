import { describe, it, expect } from "vitest";
import { mondayOf, weekdayIndexOf } from "./week";

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
