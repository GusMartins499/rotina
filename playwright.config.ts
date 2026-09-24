import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "rm -rf e2e/.data && mkdir -p e2e/.data && npx tsx src/repository/migrate.ts && npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { DATABASE_PATH: "./e2e/.data/e2e.db" },
    timeout: 120_000,
  },
});
