import { describe, it, expect } from "vitest";
import { rolloverPlan } from "./rollover";

describe("rolloverPlan", () => {
  it("plans no change when today belongs to the current week", () => {
    expect(rolloverPlan("2026-09-23", "2026-09-21")).toEqual({
      promote: null,
      discard: [],
      create: [],
    });
  });

  it("plans no change on the sunday that closes the current week", () => {
    expect(rolloverPlan("2026-09-27", "2026-09-21")).toEqual({
      promote: null,
      discard: [],
      create: [],
    });
  });

  it("plans promoting the next week when today is its monday", () => {
    expect(rolloverPlan("2026-09-28", "2026-09-21")).toEqual({
      promote: "2026-09-28",
      discard: ["2026-09-21"],
      create: ["2026-10-05"],
    });
  });

  it("plans a fresh pair when today is weeks ahead of both stored weeks", () => {
    expect(rolloverPlan("2026-10-12", "2026-09-21")).toEqual({
      promote: null,
      discard: ["2026-09-21", "2026-09-28"],
      create: ["2026-10-12", "2026-10-19"],
    });
  });

  it("does not read the clock on its own", () => {
    expect(rolloverPlan("2026-10-12", "2026-09-21")).toEqual(
      rolloverPlan("2026-10-12", "2026-09-21"),
    );
  });

  it("treats a today before the stored week as no change", () => {
    expect(rolloverPlan("2026-09-14", "2026-09-21")).toEqual({
      promote: null,
      discard: [],
      create: [],
    });
  });
});
