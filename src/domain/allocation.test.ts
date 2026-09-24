import { describe, it, expect } from "vitest";
import { planAllocation } from "./allocation";

const trabalho = { id: 1, dailyHours: 8 };
const psicologo = { id: 2, dailyHours: null };

describe("allocation planning", () => {
  it("sizes the block by the commitment daily hours", () => {
    const plan = planAllocation({
      commitment: trabalho,
      weekday: 0,
      startHour: 8,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startHour: 8, endHour: 16 });
  });

  it("sizes a commitment without daily hours as one hour", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 1,
      startHour: 18,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startHour: 18, endHour: 19 });
  });

  it("refuses an allocation that overlaps an existing block", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startHour: 12,
      existing: [{ weekday: 0, startHour: 8, endHour: 13 }],
    });

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("ignores blocks on other weekdays", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 1,
      startHour: 12,
      existing: [{ weekday: 0, startHour: 8, endHour: 13 }],
    });

    expect(plan.ok).toBe(true);
  });

  it("refuses an allocation that would pass the last hour of the day", () => {
    const plan = planAllocation({
      commitment: trabalho,
      weekday: 0,
      startHour: 22,
      existing: [],
    });

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });

  it("accepts an allocation that ends exactly at the last hour", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startHour: 22,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startHour: 22, endHour: 23 });
  });

  it("accepts an allocation that starts exactly where another ends", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startHour: 13,
      existing: [{ weekday: 0, startHour: 8, endHour: 13 }],
    });

    expect(plan.ok).toBe(true);
  });

  it("refuses an allocation before the first hour of the day", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startHour: 5,
      existing: [],
    });

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });
});
