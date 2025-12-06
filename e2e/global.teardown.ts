import { test as teardown } from "@playwright/test";
import { cleanupTestData, getTestUserId } from "./helpers/database";

/**
 * Global Teardown for E2E Tests
 *
 * Runs after all test projects have completed.
 * Cleans up all test data from the activities database.
 *
 * This follows Playwright's recommended approach using project dependencies.
 * See: https://playwright.dev/docs/test-global-setup-teardown
 */

teardown("cleanup activities database", async () => {
  const userId = getTestUserId();

  console.log("🧹 Global teardown: Cleaning up test data...");
  console.log(`   Test User ID: ${userId}`);

  try {
    await cleanupTestData(userId);
    console.log("✅ Test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    throw error;
  }
});
