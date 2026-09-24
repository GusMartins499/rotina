import { describe, it, expect } from "vitest";
import { planMove, planResize } from "./rearrange";

const monday8to13 = { id: 1, commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 };
const monday14to17 = { id: 2, commitmentId: 1, weekday: 0, startMinute: 480, endMinute: 660 };

describe("moving a block", () => {
  it("preserves the duration when moving to another slot", () => {
    const plan = planMove(monday8to13, { weekday: 1, startMinute: 180 }, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 1, startMinute: 180, endMinute: 480 });
  });

  it("refuses a move that would overlap another block", () => {
    const plan = planMove(monday8to13, { weekday: 0, startMinute: 360 }, [
      monday8to13,
      monday14to17,
    ]);

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("does not consider the moved block itself an obstacle", () => {
    const plan = planMove(monday8to13, { weekday: 0, startMinute: 180 }, [monday8to13]);

    expect(plan.ok).toBe(true);
  });

  it("refuses a move that would pass the end of the day", () => {
    const plan = planMove(monday8to13, { weekday: 0, startMinute: 840 }, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });
});

describe("resizing a block", () => {
  it("shortens a block to the requested end time", () => {
    const plan = planResize(monday8to13, 300, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 0, startMinute: 120, endMinute: 300 });
  });

  it("refuses a resize that would overlap the following block", () => {
    const plan = planResize(monday8to13, 540, [monday8to13, monday14to17]);

    expect(plan).toEqual({ ok: false, reason: "overlap" });
  });

  it("refuses a resize down to zero duration", () => {
    const plan = planResize(monday8to13, 120, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "empty" });
  });

  it("refuses a resize past the end of the day", () => {
    const plan = planResize({ ...monday8to13, startMinute: 840, endMinute: 900 }, 1080, [monday8to13]);

    expect(plan).toEqual({ ok: false, reason: "out-of-day" });
  });

  it("allows growing into free time", () => {
    const plan = planResize(monday8to13, 480, [monday8to13]);

    expect(plan).toEqual({ ok: true, weekday: 0, startMinute: 120, endMinute: 480 });
  });
});
