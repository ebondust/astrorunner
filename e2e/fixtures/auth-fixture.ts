import { test as base } from '@playwright/test';
import { E2E_USERNAME, E2E_PASSWORD } from '../helpers/database';

/**
 * Authentication fixture for E2E tests
 *
 * Extends Playwright's base test with automatic login
 * Each test will start with the user already authenticated
 */

export const test = base.extend({
  /**
   * Authenticated page fixture
   * Automatically logs in before each test
   */
  page: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for React to hydrate the form
    await page.waitForLoadState('networkidle');

    // Fill in email field
    const emailInput = page.locator('#email');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(E2E_USERNAME);

    // Fill in password field
    const passwordInput = page.locator('#password');
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(E2E_PASSWORD);

    // Wait for the login API response before navigation
    const loginPromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.status() === 200
    );

    // Press Enter to submit
    await passwordInput.press('Enter');

    // Wait for successful login response
    await loginPromise;

    // Wait for navigation to complete (should redirect to /activities)
    await page.waitForURL('/activities', { timeout: 10000 });

    // Wait for page to be fully loaded with auth state
    await page.waitForLoadState('networkidle');

    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';
