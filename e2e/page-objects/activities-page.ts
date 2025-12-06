import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Activities page
 *
 * Encapsulates all interactions with the main activities page
 */
export class ActivitiesPage {
  readonly page: Page;
  readonly addActivityButton: Locator;
  readonly activityList: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addActivityButton = page.getByTestId("add-activity-button");
    this.activityList = page.getByTestId("activity-list");
    this.emptyState = page.getByTestId("empty-state");
    this.loadingSkeleton = page.getByTestId("skeleton-loader");
  }

  /**
   * Navigate to the activities page
   */
  async goto() {
    await this.page.goto("/activities");
  }

  /**
   * Click the "Add Activity" button to open the form modal
   */
  async clickAddActivity() {
    await this.addActivityButton.click();
  }

  /**
   * Get all activity cards on the page
   */
  async getActivityCards() {
    return this.page.getByTestId("activity-card").all();
  }

  /**
   * Get a specific activity card by index (0-based)
   */
  async getActivityCardByIndex(index: number) {
    return this.page.getByTestId("activity-card").nth(index);
  }

  /**
   * Check if the empty state is visible
   */
  async isEmptyStateVisible() {
    return this.emptyState.isVisible();
  }

  /**
   * Wait for activities to finish loading
   */
  async waitForActivitiesToLoad() {
    // Wait for skeleton to disappear
    await this.loadingSkeleton.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {
      // Skeleton might not appear if data loads fast, that's ok
    });
  }

  /**
   * Get the count of activity cards displayed
   */
  async getActivityCardCount() {
    const cards = await this.getActivityCards();
    return cards.length;
  }

  /**
   * Click the delete button on a specific activity card by index
   */
  async clickDeleteOnCard(index: number) {
    const card = await this.getActivityCardByIndex(index);
    const deleteButton = card.getByTestId("delete-activity-button");
    await deleteButton.click();
  }

  /**
   * Delete the first activity card
   */
  async deleteFirstActivity() {
    await this.clickDeleteOnCard(0);
  }

  /**
   * Click the edit button on a specific activity card by index
   */
  async clickEditOnCard(index: number) {
    const card = await this.getActivityCardByIndex(index);
    const editButton = card.getByTestId("edit-activity-button");
    await editButton.click();
  }

  /**
   * Edit the first activity card
   */
  async editFirstActivity() {
    await this.clickEditOnCard(0);
  }
}
