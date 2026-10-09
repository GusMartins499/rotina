import { describe, it, expect } from "vitest";
import { contrastRatio, desaturate, MIN_TEXT_CONTRAST, PAST_SATURATION_LOSS } from "./color";
import { PALETTE } from "./commitment";

describe("contrast ratio", () => {
  it("measures black on white as the maximum ratio", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("measures a color against itself as one", () => {
    expect(contrastRatio("#0969da", "#0969da")).toBe(1);
  });
});

describe("desaturate", () => {
  it("turns a color fully gray at full amount", () => {
    const [red, green, blue] = [1, 3, 5].map((offset) =>
      desaturate("#d73a4a", 1).slice(offset, offset + 2),
    );

    expect(red).toBe(green);
    expect(green).toBe(blue);
  });

  it("keeps a gray unchanged", () => {
    expect(desaturate("#57606a", 0)).toBe("#57606a");
  });

  it.each(PALETTE)("keeps white text on dimmed %s above the contrast floor", (color) => {
    const dimmed = desaturate(color, PAST_SATURATION_LOSS);

    expect(dimmed).not.toBe(color);
    expect(contrastRatio("#ffffff", dimmed)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});
