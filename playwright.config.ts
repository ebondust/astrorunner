import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Load .env.test and override any existing environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });
/**
 * Playwright E2E Test Configuration
 * - Runs tests against Desktop Chrome (Chromium) only
 * - Includes visual regression testing with screenshots
 * - Trace and video recording for debugging
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./test-results",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
  },

  projects: [
    // Setup project - runs before all tests
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "cleanup",
    },

    // Teardown project - runs after all tests
    {
      name: "cleanup",
      testMatch: /global\.teardown\.ts/,
    },

    // Main test project - depends on setup
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
