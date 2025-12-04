import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Delete Confirmation Modal
 *
 * Encapsulates all interactions with the delete confirmation alert dialog
 */
export class DeleteConfirmationModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // AlertDialog uses role="alertdialog"
    this.dialog = page.getByRole("alertdialog");
    this.title = this.dialog.getByRole("heading", { name: /delete activity/i });
    this.description = this.dialog.getByText(/are you sure you want to delete this activity/i);
    this.cancelButton = this.dialog.getByRole("button", { name: /cancel/i });
    this.deleteButton = this.dialog.getByRole("button", { name: /delete/i });
  }

  /**
   * Check if the delete confirmation modal is visible
   */
  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }

  /**
   * Wait for the delete confirmation modal to be visible
   */
  async waitForModal() {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Click the Cancel button
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Click the Delete button to confirm deletion
   */
  async confirmDelete() {
    await this.deleteButton.click();
  }

  /**
   * Wait for the modal to be hidden (after deletion or cancellation)
   */
  async waitForModalToClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }
}
