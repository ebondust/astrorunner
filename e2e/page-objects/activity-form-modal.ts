import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Activity Form Modal
 *
 * Handles interactions with the create/edit activity modal
 */
export class ActivityFormModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly dateTimeInput: Locator;
  readonly typeSelect: Locator;
  readonly durationInput: Locator;
  readonly distanceInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formErrorMessage: Locator;
  readonly dateErrorMessage: Locator;
  readonly typeErrorMessage: Locator;
  readonly durationErrorMessage: Locator;
  readonly distanceErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId('activity-form-modal');
    this.dateTimeInput = page.getByTestId('activity-date-input');
    this.typeSelect = page.getByTestId('activity-type-select');
    this.durationInput = page.getByTestId('duration-input');
    this.distanceInput = page.getByTestId('distance-input');
    this.submitButton = page.getByTestId('submit-activity-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.formErrorMessage = page.getByTestId('form-error-message');
    this.dateErrorMessage = page.getByTestId('date-error-message');
    this.typeErrorMessage = page.getByTestId('type-error-message');
    this.durationErrorMessage = page.getByTestId('duration-error-message');
    this.distanceErrorMessage = page.getByTestId('distance-error-message');
  }

  /**
   * Fill the activity form with all fields
   */
  async fillActivityForm(data: {
    dateTime: string; // Format: YYYY-MM-DDTHH:mm
    type: 'Run' | 'Walk' | 'Mixed';
    duration: string; // Format: 1.30 or 90
    distance?: string; // Distance in km
  }) {
    await this.dateTimeInput.fill(data.dateTime);
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: data.type }).click();
    await this.durationInput.fill(data.duration);

    if (data.distance) {
      await this.distanceInput.fill(data.distance);
    }
  }

  /**
   * Submit the form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Cancel the form
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Check if the modal is visible
   */
  async isVisible() {
    return this.modal.isVisible();
  }

  /**
   * Wait for the modal to be hidden
   */
  async waitForHidden() {
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Get the form error message text
   */
  async getFormErrorMessage() {
    return this.formErrorMessage.textContent();
  }

  /**
   * Get the date error message text
   */
  async getDateErrorMessage() {
    return this.dateErrorMessage.textContent();
  }

  /**
   * Get the type error message text
   */
  async getTypeErrorMessage() {
    return this.typeErrorMessage.textContent();
  }

  /**
   * Get the duration error message text
   */
  async getDurationErrorMessage() {
    return this.durationErrorMessage.textContent();
  }

  /**
   * Get the distance error message text
   */
  async getDistanceErrorMessage() {
    return this.distanceErrorMessage.textContent();
  }
}
