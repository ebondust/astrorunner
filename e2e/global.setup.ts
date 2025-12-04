import { test as setup } from "@playwright/test";
import { cleanupTestData, getTestUserId } from "./helpers/database";

/**
 * Global Setup for E2E Tests
 *
 * Runs before all test projects.
 * Ensures a clean database state before tests begin.
 *
 * This follows Playwright's recommended approach using project dependencies.
 * See: https://playwright.dev/docs/test-global-setup-teardown
 */

setup("prepare clean database", async () => {
  const userId = getTestUserId();

  console.log("🚀 Global setup: Preparing test environment...");
  console.log(`   Test User ID: ${userId}`);

  try {
    // Clean up any leftover test data from previous runs
    await cleanupTestData(userId);
    console.log("✅ Database ready for testing");
  } catch (error) {
    console.error("❌ Failed to prepare database:", error);
    throw error;
  }
});
