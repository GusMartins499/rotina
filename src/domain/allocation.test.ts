import { describe, it, expect } from "vitest";
import { planAllocation } from "./allocation";

const trabalho = { id: 1, dailyMinutes: 480 };
const psicologo = { id: 2, dailyMinutes: null };

describe("allocation planning", () => {
  it("sizes the block by the commitment daily hours", () => {
    const plan = planAllocation({
      commitment: trabalho,
      weekday: 0,
      startMinute: 120,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startMinute: 120, endMinute: 600 });
  });

  it("sizes a commitment without daily minutes as one step", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 1,
      startMinute: 720,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startMinute: 720, endMinute: 750 });
  });

  it("refuses an allocation that overlaps an existing block", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startMinute: 360,
      existing: [{ weekday: 0, startMinute: 120, endMinute: 420 }],
    });

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("ignores blocks on other weekdays", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 1,
      startMinute: 360,
      existing: [{ weekday: 0, startMinute: 120, endMinute: 420 }],
    });

    expect(plan.ok).toBe(true);
  });

  it("refuses an allocation that would pass the last hour of the day", () => {
    const plan = planAllocation({
      commitment: trabalho,
      weekday: 0,
      startMinute: 960,
      existing: [],
    });

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });

  it("accepts an allocation that ends exactly at the last hour", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startMinute: 990,
      existing: [],
    });

    expect(plan).toEqual({ ok: true, startMinute: 990, endMinute: 1020 });
  });

  it("accepts an allocation that starts exactly where another ends", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startMinute: 420,
      existing: [{ weekday: 0, startMinute: 120, endMinute: 420 }],
    });

    expect(plan.ok).toBe(true);
  });

  it("refuses an allocation before the first hour of the day", () => {
    const plan = planAllocation({
      commitment: psicologo,
      weekday: 0,
      startMinute: -60,
      existing: [],
    });

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });
});
