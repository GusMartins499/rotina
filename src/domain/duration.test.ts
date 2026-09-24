import { describe, it, expect } from "vitest";
import { parseDuration } from "./duration";

describe("duration input", () => {
  it("accepts a duration written in hours and minutes", () => {
    expect(parseDuration("1h30")).toBe(90);
  });

  it("accepts whole hours", () => {
    expect(parseDuration("2h")).toBe(120);
  });

  it("accepts minutes alone", () => {
    expect(parseDuration("30min")).toBe(30);
  });

  it("accepts a bare number as hours", () => {
    expect(parseDuration("8")).toBe(480);
  });

  it("accepts a decimal number as hours", () => {
    expect(parseDuration("2,5")).toBe(150);
  });

  it("ignores surrounding whitespace", () => {
    expect(parseDuration("  1h30  ")).toBe(90);
  });

  it("rejects a duration off the step", () => {
    expect(parseDuration("1h20")).toBeNull();
  });

  it("rejects a duration longer than the day", () => {
    expect(parseDuration("20h")).toBeNull();
  });

  it("rejects a duration of zero", () => {
    expect(parseDuration("0")).toBeNull();
  });

  it("rejects text that is not a duration", () => {
    expect(parseDuration("amanhã")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(parseDuration("")).toBeNull();
  });
});
