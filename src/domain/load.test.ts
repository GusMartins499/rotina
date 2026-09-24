import { describe, it, expect } from "vitest";
import { remainingFor, weeklyLoadFor } from "./load";

const trabalho = { id: 1, dailyMinutes: 480 };
const psicologo = { id: 2, dailyMinutes: null };

describe("daily remainder", () => {
  it("computes the remaining daily minutes from the allocated blocks", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
    ]);

    expect(remaining).toEqual({ kind: "missing", minutes: 180 });
  });

  it("returns zero remainder once the daily load is met", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
      { commitmentId: 1, weekday: 0, startMinute: 480, endMinute: 660 },
    ]);

    expect(remaining).toEqual({ kind: "met" });
  });

  it("reports an excess instead of a negative remainder", () => {
    const remaining = remainingFor({ id: 1, dailyMinutes: 240 }, 0, [
      { commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 480 },
    ]);

    expect(remaining).toEqual({ kind: "exceeded", minutes: 120 });
  });

  it("returns no remainder for a commitment without daily hours", () => {
    const remaining = remainingFor(psicologo, 1, [
      { commitmentId: 2, weekday: 1, startMinute: 720, endMinute: 780 },
    ]);

    expect(remaining).toBeNull();
  });

  it("ignores blocks of other commitments", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 2, weekday: 0, startMinute: 120, endMinute: 420 },
    ]);

    expect(remaining).toEqual({ kind: "missing", minutes: 480 });
  });

  it("ignores blocks of other weekdays", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 1, startMinute: 120, endMinute: 600 },
    ]);

    expect(remaining).toEqual({ kind: "missing", minutes: 480 });
  });
});

describe("weekly load", () => {
  it("sums the weekly load across every weekday", () => {
    const total = weeklyLoadFor(trabalho, [
      { commitmentId: 1, weekday: 0, startMinute: 120, endMinute: 420 },
      { commitmentId: 1, weekday: 0, startMinute: 480, endMinute: 660 },
      { commitmentId: 1, weekday: 1, startMinute: 120, endMinute: 600 },
    ]);

    expect(total).toBe(960);
  });

  it("is zero for a commitment with no blocks", () => {
    expect(weeklyLoadFor(psicologo, [])).toBe(0);
  });
});
