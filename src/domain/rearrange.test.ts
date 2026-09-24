import { describe, it, expect } from "vitest";
import { planMove, planResize } from "./rearrange";

const monday8to13 = { id: 1, commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 };
const monday14to17 = { id: 2, commitmentId: 1, weekday: 0, startHour: 14, endHour: 17 };

describe("moving a block", () => {
  it("preserves the duration when moving to another slot", () => {
    const plan = planMove(monday8to13, { weekday: 1, startHour: 9 }, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 1, startHour: 9, endHour: 14 });
  });

  it("refuses a move that would overlap another block", () => {
    const plan = planMove(monday8to13, { weekday: 0, startHour: 12 }, [
      monday8to13,
      monday14to17,
    ]);

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("does not consider the moved block itself an obstacle", () => {
    const plan = planMove(monday8to13, { weekday: 0, startHour: 9 }, [monday8to13]);

    expect(plan.ok).toBe(true);
  });

  it("refuses a move that would pass the end of the day", () => {
    const plan = planMove(monday8to13, { weekday: 0, startHour: 20 }, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });
});

describe("resizing a block", () => {
  it("shortens a block to the requested end hour", () => {
    const plan = planResize(monday8to13, 11, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 0, startHour: 8, endHour: 11 });
  });

  it("refuses a resize that would overlap the following block", () => {
    const plan = planResize(monday8to13, 15, [monday8to13, monday14to17]);

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("refuses a resize down to zero duration", () => {
    const plan = planResize(monday8to13, 8, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "empty" });
  });

  it("refuses a resize past the end of the day", () => {
    const plan = planResize({ ...monday8to13, startHour: 20, endHour: 21 }, 24, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });

  it("allows growing into free hours", () => {
    const plan = planResize(monday8to13, 14, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 0, startHour: 8, endHour: 14 });
  });
});
