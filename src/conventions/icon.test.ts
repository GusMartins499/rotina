import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contrastRatio } from "@/domain/color";
import { viewport } from "@/app/layout";

const APP = resolve(import.meta.dirname, "../app");
const ICON = readFileSync(resolve(APP, "icon.svg"), "utf8");
const APPLE_ICON = readFileSync(resolve(APP, "apple-icon.png"));
const STYLESHEET = readFileSync(resolve(APP, "globals.css"), "utf8");

const FAVICON_PIXELS = 16;
const APPLE_ICON_PIXELS = 180;
const NON_TEXT_CONTRAST = 3;
const PNG_TRUECOLOUR_WITHOUT_ALPHA = 2;

type Rect = { x: number; y: number; width: number; height: number; fill?: string };

function attribute(element: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(element)?.[1];
}

function rects(): Rect[] {
  return [...ICON.matchAll(/<rect\b[^>]*>/g)].map(([element]) => ({
    x: Number(attribute(element, "x") ?? 0),
    y: Number(attribute(element, "y") ?? 0),
    width: Number(attribute(element, "width")),
    height: Number(attribute(element, "height")),
    fill: attribute(element, "fill"),
  }));
}

function bars(): Rect[] {
  return rects().slice(1);
}

function background(): string {
  const fill = rects()[0].fill;
  if (!fill) throw new Error("the icon background rect has no fill");
  return fill;
}

function barFill(): string {
  const fill = /<g\b[^>]*\sfill="([^"]*)"/.exec(ICON)?.[1];
  if (!fill) throw new Error("the icon bars group has no fill");
  return fill;
}

function token(selector: string, name: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(STYLESHEET)?.[1];
  const value = block && new RegExp(`${name}:\\s*([^;]+);`).exec(block)?.[1];
  if (!value) throw new Error(`token ${name} not found under ${selector}`);
  return value.trim();
}

function themeColours(): { media?: string; color: string }[] {
  const themeColor = viewport.themeColor;
  if (!Array.isArray(themeColor)) throw new Error("themeColor is not declared per colour scheme");
  return themeColor;
}

describe("app icon", () => {
  it("draws on a sixteen unit grid so each unit is one favicon pixel", () => {
    expect(attribute(ICON, "viewBox")).toBe(`0 0 ${FAVICON_PIXELS} ${FAVICON_PIXELS}`);
    expect(rects()[0]).toMatchObject({ x: 0, y: 0, width: FAVICON_PIXELS, height: FAVICON_PIXELS });
  });

  it("stays legible at 16px with whole pixel bars at least two pixels wide and apart", () => {
    const columns = bars();

    expect(columns.length).toBeGreaterThanOrEqual(2);
    for (const bar of columns) {
      expect(Number.isInteger(bar.x) && Number.isInteger(bar.y)).toBe(true);
      expect(bar.width).toBeGreaterThanOrEqual(2);
      expect(bar.x).toBeGreaterThanOrEqual(2);
      expect(bar.x + bar.width).toBeLessThanOrEqual(FAVICON_PIXELS - 2);
    }
    columns.slice(1).forEach((bar, index) => {
      const previous = columns[index];
      expect(bar.x - (previous.x + previous.width)).toBeGreaterThanOrEqual(2);
    });
    expect(new Set(columns.map((bar) => bar.height)).size).toBeGreaterThan(1);
  });

  it("uses the brand accent rather than any commitment colour", () => {
    expect(background()).toBe(token(":root", "--accent"));
  });

  it("keeps the bars readable against the filled background", () => {
    expect(contrastRatio(barFill(), background())).toBeGreaterThanOrEqual(4.5);
  });

  it("reads on both light and dark browser chrome", () => {
    for (const { color } of themeColours()) {
      expect(contrastRatio(background(), color)).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST);
    }
  });

  it("ships the apple touch icon as an opaque 180px png", () => {
    expect(APPLE_ICON.readUInt32BE(16)).toBe(APPLE_ICON_PIXELS);
    expect(APPLE_ICON.readUInt32BE(20)).toBe(APPLE_ICON_PIXELS);
    expect(APPLE_ICON[25]).toBe(PNG_TRUECOLOUR_WITHOUT_ALPHA);
  });

  it("declares a theme colour matching the page background of each scheme", () => {
    const [light, dark] = themeColours();

    expect(light).toEqual({ media: "(prefers-color-scheme: light)", color: token(":root", "--bg") });
    expect(dark).toEqual({
      media: "(prefers-color-scheme: dark)",
      color: token(':root[data-theme="dark"]', "--bg"),
    });
  });
});
