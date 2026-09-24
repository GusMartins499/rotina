import { describe, it, expect } from "vitest";
import { remainingFor, weeklyLoadFor } from "./load";

const trabalho = { id: 1, dailyHours: 8 };
const psicologo = { id: 2, dailyHours: null };

describe("daily remainder", () => {
  it("computes the remaining daily hours from the allocated blocks", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 },
    ]);

    expect(remaining).toEqual({ kind: "missing", hours: 3 });
  });

  it("returns zero remainder once the daily load is met", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 },
      { commitmentId: 1, weekday: 0, startHour: 14, endHour: 17 },
    ]);

    expect(remaining).toEqual({ kind: "met" });
  });

  it("reports an excess instead of a negative remainder", () => {
    const remaining = remainingFor({ id: 1, dailyHours: 4 }, 0, [
      { commitmentId: 1, weekday: 0, startHour: 8, endHour: 14 },
    ]);

    expect(remaining).toEqual({ kind: "exceeded", hours: 2 });
  });

  it("returns no remainder for a commitment without daily hours", () => {
    const remaining = remainingFor(psicologo, 1, [
      { commitmentId: 2, weekday: 1, startHour: 18, endHour: 19 },
    ]);

    expect(remaining).toBeNull();
  });

  it("ignores blocks of other commitments", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 2, weekday: 0, startHour: 8, endHour: 13 },
    ]);

    expect(remaining).toEqual({ kind: "missing", hours: 8 });
  });

  it("ignores blocks of other weekdays", () => {
    const remaining = remainingFor(trabalho, 0, [
      { commitmentId: 1, weekday: 1, startHour: 8, endHour: 16 },
    ]);

    expect(remaining).toEqual({ kind: "missing", hours: 8 });
  });
});

describe("weekly load", () => {
  it("sums the weekly load across every weekday", () => {
    const total = weeklyLoadFor(trabalho, [
      { commitmentId: 1, weekday: 0, startHour: 8, endHour: 13 },
      { commitmentId: 1, weekday: 0, startHour: 14, endHour: 17 },
      { commitmentId: 1, weekday: 1, startHour: 8, endHour: 16 },
    ]);

    expect(total).toBe(16);
  });

  it("is zero for a commitment with no blocks", () => {
    expect(weeklyLoadFor(psicologo, [])).toBe(0);
  });
});
