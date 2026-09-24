import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const alias = { "@": resolve(import.meta.dirname, "src") };

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/domain/**/*.test.ts", "src/repository/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/app/**/*.test.ts", "src/app/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
