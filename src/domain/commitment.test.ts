import { describe, it, expect } from "vitest";
import { PALETTE, commitmentInputSchema } from "./commitment";

const valid = { name: "TRABALHO", color: PALETTE[0], dailyMinutes: 480 };

describe("commitment input", () => {
  it("accepts a commitment with name, color and daily hours", () => {
    expect(commitmentInputSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a commitment without daily hours", () => {
    const parsed = commitmentInputSchema.parse({ ...valid, dailyMinutes: null });
    expect(parsed.dailyMinutes).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(() => commitmentInputSchema.parse({ ...valid, name: "   " })).toThrow();
  });

  it("rejects daily hours above the hours available in a day", () => {
    expect(() => commitmentInputSchema.parse({ ...valid, dailyMinutes: 24 })).toThrow();
  });

  it("rejects daily hours below one", () => {
    expect(() => commitmentInputSchema.parse({ ...valid, dailyMinutes: 0 })).toThrow();
  });

  it("rejects a color outside the palette", () => {
    expect(() => commitmentInputSchema.parse({ ...valid, color: "#ffff00" })).toThrow();
  });

  it("trims surrounding whitespace from the name", () => {
    expect(commitmentInputSchema.parse({ ...valid, name: "  TRABALHO  " }).name).toBe(
      "TRABALHO",
    );
  });
});
