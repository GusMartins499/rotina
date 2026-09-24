import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SOURCE = resolve(import.meta.dirname, "..");

const PORTUGUESE_WORDS = [
  "compromisso",
  "semana",
  "carga",
  "bloco",
  "proxima",
  "diaria",
];

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function directories(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? [entry, ...directories(path)] : [];
  });
}

describe("source tree naming", () => {
  it("has no portuguese directory under src", () => {
    const offenders = directories(SOURCE).filter((name) =>
      PORTUGUESE_WORDS.some((word) => name.toLowerCase().includes(word)),
    );

    expect(offenders).toEqual([]);
  });

  it("has no portuguese file name under src", () => {
    const offenders = walk(SOURCE)
      .map((path) => path.slice(SOURCE.length + 1))
      .filter((name) => PORTUGUESE_WORDS.some((word) => name.toLowerCase().includes(word)));

    expect(offenders).toEqual([]);
  });

  it("declares no portuguese route or query value", () => {
    const offenders = walk(SOURCE)
      .filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"))
      .filter((path) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"))
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return /href=\{?"\/(?:compromissos|semana)/.test(source) || /week=proxima|semana=next/.test(source);
      });

    expect(offenders).toEqual([]);
  });
});
