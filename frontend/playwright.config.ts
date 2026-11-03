import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (existsSync("/opt/google/chrome/chrome") ? "chrome" : undefined),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: [["list"], ["json", { outputFile: "../docs/e2e-results.json" }]],
});
