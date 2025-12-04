import { test, expect } from "../fixtures/auth-fixture";
import { ActivitiesPage } from "../page-objects/activities-page";
import { ActivityFormModal } from "../page-objects/activity-form-modal";
import { cleanupTestData, getTestUserId } from "../helpers/database";
import { formInputData } from "../fixtures/test-data";

/**
 * E2E Tests for User Story 2: Create New Activity
 *
 * Test scenarios:
 * - TC-E2E-004: Create activity with all fields
 * - TC-E2E-005: Create activity with required fields only
 * - TC-E2E-006: Cancel activity creation
 *
 * Note: Tests must run serially because they share the same test user account.
 * Running in parallel would cause interference between tests.
 */

test.describe.configure({ mode: "serial" });

test.describe("User Story 2: Create New Activity", () => {
  let activitiesPage: ActivitiesPage;
  let formModal: ActivityFormModal;
  const userId = getTestUserId();

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    activitiesPage = new ActivitiesPage(page);
    formModal = new ActivityFormModal(page);

    // Navigate to activities page (already authenticated via fixture)
    await activitiesPage.goto();
    await activitiesPage.waitForActivitiesToLoad();
  });

  test.afterEach(async () => {
    // Clean up test data after each test to ensure isolation
    await cleanupTestData(userId);
  });

  /**
   * TC-E2E-004: Create activity with all fields
   *
   * Verifies that a user can create a new activity with all fields populated
   * and that the activity appears immediately (optimistic update) and persists
   * after page refresh.
   */
  test("TC-E2E-004: should create activity with all fields", async ({ page }) => {
    // Arrange: Verify empty state
    expect(await activitiesPage.isEmptyStateVisible()).toBe(true);

    // Act: Open add activity form
    await activitiesPage.clickAddActivity();
    await expect(formModal.modal).toBeVisible();

    // Act: Fill form with all fields
    await formModal.fillActivityForm(formInputData.runWithAllFields);
    await formModal.submit();

    // Assert: Modal closes
    await expect(formModal.modal).toBeHidden();

    // Assert: Optimistic update - activity appears immediately
    const cards = await activitiesPage.getActivityCards();
    expect(cards).toHaveLength(1);

    // Assert: Verify activity details
    const newCard = await activitiesPage.getActivityCardByIndex(0);
    await expect(newCard.getByTestId("activity-type-badge")).toHaveText("Run");
    await expect(newCard.getByTestId("activity-time")).toContainText("14:30");
    await expect(newCard.getByTestId("activity-duration")).toContainText("1h 45m");
    await expect(newCard.getByTestId("activity-distance")).toContainText("12.00 km");

    // Assert: Activity persists after refresh
    await page.reload();
    await activitiesPage.waitForActivitiesToLoad();

    const persistedCards = await activitiesPage.getActivityCards();
    expect(persistedCards).toHaveLength(1);

    // Verify details still match after reload
    const persistedCard = await activitiesPage.getActivityCardByIndex(0);
    await expect(persistedCard.getByTestId("activity-type-badge")).toHaveText("Run");
    await expect(persistedCard.getByTestId("activity-duration")).toContainText("1h 45m");
  });

  /**
   * TC-E2E-005: Create activity with required fields only
   *
   * Verifies that a user can create an activity without providing
   * optional fields (distance), and that the UI displays a placeholder
   * for missing optional data.
   */
  test("TC-E2E-005: should create activity with required fields only", async ({ page }) => {
    // Arrange: Verify empty state
    expect(await activitiesPage.isEmptyStateVisible()).toBe(true);

    // Act: Open add activity form
    await activitiesPage.clickAddActivity();
    await expect(formModal.modal).toBeVisible();

    // Act: Fill form with required fields only (no distance)
    await formModal.fillActivityForm(formInputData.walkRequiredOnly);
    await formModal.submit();

    // Assert: Modal closes
    await expect(formModal.modal).toBeHidden();

    // Assert: Activity appears
    const cards = await activitiesPage.getActivityCards();
    expect(cards).toHaveLength(1);

    // Assert: Verify activity details
    const newCard = await activitiesPage.getActivityCardByIndex(0);
    await expect(newCard.getByTestId("activity-type-badge")).toHaveText("Walk");
    await expect(newCard.getByTestId("activity-time")).toContainText("09:00");
    await expect(newCard.getByTestId("activity-duration")).toContainText("30m");

    // Assert: Distance shows placeholder when not provided
    await expect(newCard.getByTestId("activity-distance")).toContainText("—");

    // Assert: Activity persists after refresh
    await page.reload();
    await activitiesPage.waitForActivitiesToLoad();

    const persistedCards = await activitiesPage.getActivityCards();
    expect(persistedCards).toHaveLength(1);
  });

  /**
   * TC-E2E-006: Cancel activity creation
   *
   * Verifies that canceling the activity form does not create an activity
   * and that any entered data is discarded.
   */
  test("TC-E2E-006: should cancel activity creation without saving", async ({ page }) => {
    // Arrange: Verify empty state
    expect(await activitiesPage.isEmptyStateVisible()).toBe(true);

    // Act: Open add activity form
    await activitiesPage.clickAddActivity();
    await expect(formModal.modal).toBeVisible();

    // Act: Fill form with data
    await formModal.fillActivityForm(formInputData.runWithAllFields);

    // Act: Cancel without submitting
    await formModal.cancel();

    // Assert: Modal closes
    await expect(formModal.modal).toBeHidden();

    // Assert: No activity created - empty state still visible
    expect(await activitiesPage.isEmptyStateVisible()).toBe(true);

    // Assert: Activity count is still 0
    const cardCount = await activitiesPage.getActivityCardCount();
    expect(cardCount).toBe(0);

    // Assert: Verify no activity was created by refreshing
    await page.reload();
    await activitiesPage.waitForActivitiesToLoad();
    expect(await activitiesPage.isEmptyStateVisible()).toBe(true);
  });
});
