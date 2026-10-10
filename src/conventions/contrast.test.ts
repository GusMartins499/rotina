import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PALETTE } from "@/domain/commitment";

const STYLESHEET = readFileSync(
  resolve(import.meta.dirname, "../app/globals.css"),
  "utf8",
);

const AA_SMALL_TEXT = 4.5;

type Rgb = [number, number, number];

function declarations(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(
    STYLESHEET,
  );
  if (!match) throw new Error(`selector ${selector} not found in globals.css`);
  return Object.fromEntries(
    match[1]
      .split(";")
      .map((declaration) => declaration.split(":").map((part) => part.trim()))
      .filter(([property, value]) => property && value)
      .map(([property, ...value]) => [property, value.join(":")]),
  );
}

type Theme = "light" | "dark";

function tokens(theme: Theme): Record<string, string> {
  return theme === "dark"
    ? { ...declarations(":root"), ...declarations(':root[data-theme="dark"]') }
    : declarations(":root");
}

function token(value: string, theme: Theme): string {
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  return variable ? token(tokens(theme)[variable[1]], theme) : value;
}

function hex(value: string, theme: Theme = "light"): Rgb {
  const resolved = token(value, theme);
  if (!/^#[0-9a-f]{6}$/i.test(resolved)) {
    throw new Error(`colour ${resolved} is not a six digit hex`);
  }
  return [1, 3, 5].map((index) =>
    parseInt(resolved.slice(index, index + 2), 16),
  ) as Rgb;
}

function renderedColour(
  cascade: string[],
  background: string,
  theme: Theme = "light",
): Rgb {
  const rules = cascade.map(declarations);
  const colour = rules.reduce<string | undefined>(
    (inherited, rule) => rule.color ?? inherited,
    undefined,
  );
  if (!colour) throw new Error(`no colour declared along ${cascade.join(" > ")}`);
  const opacity = rules.reduce(
    (product, rule) => product * Number(rule.opacity ?? 1),
    1,
  );
  const foreground = hex(colour, theme);
  const behind = hex(background, theme);
  return foreground.map(
    (channel, index) => channel * opacity + behind[index] * (1 - opacity),
  ) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: Rgb, background: string, theme: Theme = "light"): number {
  const [lighter, darker] = [luminance(foreground), luminance(hex(background, theme))].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

const BLOCK_LAYOUTS = [
  [".block"],
  [".block", '.block[data-compact="true"]'],
];

describe("text contrast", () => {
  it("keeps the block interval above 4.5:1 on every palette colour", () => {
    const ratios = BLOCK_LAYOUTS.flatMap((layout) =>
      PALETTE.map((colour) =>
        contrast(renderedColour([...layout, ".block-time"], colour), colour),
      ),
    );

    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the block name above 4.5:1 on every palette colour", () => {
    const ratios = BLOCK_LAYOUTS.flatMap((layout) =>
      PALETTE.map((colour) =>
        contrast(renderedColour([...layout, ".block-name"], colour), colour),
      ),
    );

    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the half hour label above 4.5:1 against the grid surface", () => {
    const surface = declarations(".week-grid").background;
    const half = renderedColour([".hour-label", ".hour-label-half"], surface);

    expect(contrast(half, surface)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the whole hour label visually stronger than the half hour label", () => {
    const surface = declarations(".week-grid").background;
    const whole = renderedColour([".hour-label"], surface);
    const half = renderedColour([".hour-label", ".hour-label-half"], surface);

    expect(contrast(whole, surface)).toBeGreaterThan(contrast(half, surface));
    expect(parseFloat(declarations(".hour-label-half")["font-size"])).toBeLessThan(
      parseFloat(declarations(".hour-label")["font-size"]),
    );
  });

  it("keeps the drawer hint readable", () => {
    const surface = "var(--surface)";
    const hint = renderedColour([".drawer-hint"], surface);

    expect(contrast(hint, surface)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the week switcher note readable on the page background", () => {
    const page = "var(--bg)";
    const note = renderedColour([".week-switcher small"], page);

    expect(contrast(note, page)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the block interval quieter than the block name", () => {
    const time = declarations(".block-time");
    const name = declarations(".block-name");

    expect(parseFloat(time["font-size"])).toBeLessThan(
      parseFloat(declarations(".block")["font-size"]),
    );
    expect(Number(time["font-weight"])).toBeLessThan(Number(name["font-weight"]));
  });
});

describe("dark theme contrast", () => {
  it("keeps every palette colour above 4.5:1 in dark", () => {
    const ratios = BLOCK_LAYOUTS.flatMap((layout) =>
      [".block-name", ".block-time"].flatMap((part) =>
        PALETTE.map((colour) =>
          contrast(renderedColour([...layout, part], colour, "dark"), colour, "dark"),
        ),
      ),
    );

    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the hour labels readable and ranked against the dark grid surface", () => {
    const surface = declarations(".week-grid").background;
    const whole = renderedColour([".hour-label"], surface, "dark");
    const half = renderedColour([".hour-label", ".hour-label-half"], surface, "dark");

    expect(contrast(half, surface, "dark")).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
    expect(contrast(whole, surface, "dark")).toBeGreaterThan(contrast(half, surface, "dark"));
  });

  it("keeps the drawer hint and the week switcher note readable in dark", () => {
    const hint = renderedColour([".drawer-hint"], "var(--surface)", "dark");
    const note = renderedColour([".week-switcher small"], "var(--bg)", "dark");

    expect(contrast(hint, "var(--surface)", "dark")).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
    expect(contrast(note, "var(--bg)", "dark")).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("keeps the highlighted state readable without turning it into a bright patch", () => {
    const highlight = "var(--accent-soft)";

    expect(contrast(hex("var(--accent)", "dark"), highlight, "dark")).toBeGreaterThanOrEqual(
      AA_SMALL_TEXT,
    );
    expect(luminance(hex(highlight, "dark"))).toBeLessThan(luminance(hex("var(--muted)", "dark")));
  });

  it("keeps the refused preview a dark surface with readable text", () => {
    const refused = declarations('.placement-preview[data-refused="true"]');

    expect(
      contrast(hex(refused.color, "dark"), refused.background, "dark"),
    ).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
    expect(luminance(hex(refused.background, "dark"))).toBeLessThan(
      luminance(hex("var(--line-strong)", "dark")),
    );
  });

  it("keeps the toast text readable on the inverted surface in both themes", () => {
    const toast = declarations(".toast");

    for (const theme of ["light", "dark"] as const) {
      expect(
        contrast(hex(toast.color, theme), toast.background, theme),
      ).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
    }
  });

  it("keeps the grid lines visible in dark", () => {
    const surface = declarations(".week-grid").background;
    const whole = declarations(".slot")["border-bottom"];
    const half = declarations('.slot[data-half="true"]')["border-bottom"];

    expect(whole).toMatch(/solid var\(--line-strong\)$/);
    expect(half).toMatch(/dashed/);
    expect(contrast(hex("var(--line-strong)", "dark"), surface, "dark")).toBeGreaterThanOrEqual(
      contrast(hex("var(--line-strong)"), surface),
    );
  });
});
