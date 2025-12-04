# E2E Test Plan - Activities Page

**Document Version:** 1.0
**Created:** 2025-11-30
**Status:** Draft
**Test Framework:** Playwright
**Browser:** Chromium (Desktop Chrome)

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Approach](#testing-approach)
3. [Test Environment Setup](#test-environment-setup)
4. [Prerequisites - Adding data-testid Attributes](#prerequisites---adding-data-testid-attributes)
5. [Page Object Model Structure](#page-object-model-structure)
6. [User Stories and Test Scenarios](#user-stories-and-test-scenarios)
7. [Data Test IDs Reference](#data-test-ids-reference)
8. [Test Execution Strategy](#test-execution-strategy)
9. [Acceptance Criteria](#acceptance-criteria)

---

## Overview

This document outlines the end-to-end testing strategy for the Activities page of AstroRunner using Playwright. The Activities page is the core feature of the application, allowing users to view, create, edit, and delete their run and walk activities.

### Objectives

- Verify all CRUD operations work correctly with optimistic updates
- Ensure month navigation and filtering functions properly
- Validate form validation and error handling
- Test responsive design across different viewports
- Verify accessibility compliance
- Ensure data persistence and state management

### Scope

**In Scope:**
- Activity list display and empty states
- Activity creation with all fields
- Activity editing and updates
- Activity deletion with confirmation
- Month navigation (previous, next, today, picker)
- Form validation and error messages
- Optimistic UI updates and rollback on error
- Loading and error states

**Out of Scope:**
- Authentication flows (separate test suite)
- Profile management
- Statistics and calendar views (Phase 2)
- Performance/load testing

---

## Testing Approach

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Testing Principles

1. **Arrange-Act-Assert Pattern**: Every test follows clear setup, execution, and verification steps
2. **Isolation**: Each test uses a fresh browser context and test data
3. **Resilience**: Use `data-testid` attributes for stable selectors
4. **Reusability**: Page Object Model for maintainable tests
5. **Parallel Execution**: Tests run independently for faster feedback
6. **Visual Regression**: Screenshot comparison for UI consistency

---

## Test Environment Setup

### Environment Configuration

**Note:** The project uses `.env.test` which is already configured locally. This configuration points to a **live remote database** specifically designated for E2E testing.

```bash
# .env.test (already configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_e2e_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_e2e_service_role_key
OPENROUTER_API_KEY=test_key_placeholder
NODE_ENV=test
```

### Playwright Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install chromium
```

### Test Database Setup

```typescript
// e2e/helpers/database.ts
import { createClient } from '@supabase/supabase-js';

export async function setupTestUser(email: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create test user and return userId
  // Note: Uses remote E2E test database
}

export async function cleanupTestData(userId: string) {
  // Delete all activities for test user
  // Reset state in remote test database
}

export async function seedActivity(userId: string, activityData: any) {
  // Insert test activity into remote database
}

export async function seedActivities(userId: string, activities: any[]) {
  // Insert multiple test activities
}
```

---

## Prerequisites - Adding data-testid Attributes

⚠️ **IMPORTANT**: Before implementing E2E tests, `data-testid` attributes must be added to all components listed below.

### Components Requiring data-testid Attributes

#### ActivitiesPageContainer.tsx
- [ ] `activities-page-container` - Root container
- [ ] `add-activity-button` - Add activity button
- [ ] `error-banner` - Error message display

#### ActivityList.tsx
- [ ] `activity-list` - List container
- [ ] `empty-state` - Empty state component
- [ ] `skeleton-loader` - Loading skeleton

#### ActivityCard.tsx
- [ ] `activity-card` - Card wrapper
- [ ] `activity-type-badge` - Type badge (Run/Walk/Mixed)
- [ ] `activity-time` - Time display
- [ ] `activity-duration` - Duration display
- [ ] `activity-distance` - Distance display
- [ ] `edit-activity-button` - Edit button
- [ ] `delete-activity-button` - Delete button

#### DateHeader.tsx
- [ ] `date-header` - Header container
- [ ] `today-badge` - "Today" badge indicator

#### MonthNavigation.tsx
- [ ] `month-navigation` - Navigation bar
- [ ] `previous-month-button` - Previous month button
- [ ] `next-month-button` - Next month button
- [ ] `month-display` - Clickable month/year display
- [ ] `today-button` - Today button

#### ActivityFormModal.tsx
- [ ] `activity-form-modal` - Modal dialog
- [ ] `activity-date-input` - Date/time input
- [ ] `activity-type-select` - Type dropdown
- [ ] `duration-input` - Duration input
- [ ] `distance-input` - Distance input (optional)
- [ ] `submit-activity-button` - Submit button
- [ ] `cancel-button` - Cancel button
- [ ] `form-error-message` - Form-level error
- [ ] `date-error-message` - Date field error
- [ ] `type-error-message` - Type field error
- [ ] `duration-error-message` - Duration field error
- [ ] `distance-error-message` - Distance field error

#### DeleteConfirmationModal.tsx
- [ ] `delete-confirmation-modal` - Modal dialog
- [ ] `activity-preview` - Activity details preview
- [ ] `confirm-delete-button` - Confirm button
- [ ] `cancel-delete-button` - Cancel button

#### MonthYearPickerModal.tsx
- [ ] `month-picker-modal` - Modal dialog
- [ ] `month-select` - Month dropdown
- [ ] `year-select` - Year dropdown
- [ ] `confirm-month-button` - Confirm button
- [ ] `cancel-month-button` - Cancel button

#### EmptyState.tsx
- [ ] `empty-state-message` - Message text
- [ ] `empty-state-cta` - Call-to-action button

### Implementation Example

```tsx
// Example: ActivityCard.tsx
export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  return (
    <Card data-testid="activity-card" className="...">
      <div className="...">
        <Badge data-testid="activity-type-badge">{activity.activityType}</Badge>
        <span data-testid="activity-time">{formatTime(activity.activityDate)}</span>
        <div className="...">
          <Button
            data-testid="edit-activity-button"
            onClick={onEdit}
            aria-label="Edit activity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            data-testid="delete-activity-button"
            onClick={onDelete}
            aria-label="Delete activity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="...">
        <span data-testid="activity-duration">
          <Clock className="h-4 w-4" />
          {formatDuration(activity.duration)}
        </span>
        <span data-testid="activity-distance">
          <MapPin className="h-4 w-4" />
          {formatDistance(activity.distanceMeters)}
        </span>
      </div>
    </Card>
  );
}
```

---

## Page Object Model Structure

### Directory Structure

```
e2e/
├── page-objects/
│   ├── activities-page.ts           # Main activities page POM
│   ├── activity-form-modal.ts       # Create/edit form POM
│   ├── delete-confirmation-modal.ts # Delete modal POM
│   ├── month-navigation.ts          # Month selector POM
│   └── components/
│       ├── activity-card.ts         # Activity card POM
│       └── top-bar.ts               # Navigation bar POM
├── fixtures/
│   ├── test-data.ts                 # Test activity data
│   └── test-users.ts                # Test user data
├── helpers/
│   ├── database.ts                  # Database utilities
│   └── assertions.ts                # Custom assertions
└── tests/
    ├── activity-creation.spec.ts
    ├── activity-editing.spec.ts
    ├── activity-deletion.spec.ts
    ├── month-navigation.spec.ts
    ├── empty-state.spec.ts
    └── form-validation.spec.ts
```

### Example Page Object: ActivitiesPage

```typescript
// e2e/page-objects/activities-page.ts
import type { Page, Locator } from '@playwright/test';

export class ActivitiesPage {
  readonly page: Page;
  readonly addActivityButton: Locator;
  readonly monthNavigation: Locator;
  readonly activityList: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addActivityButton = page.getByTestId('add-activity-button');
    this.monthNavigation = page.getByTestId('month-navigation');
    this.activityList = page.getByTestId('activity-list');
    this.emptyState = page.getByTestId('empty-state');
    this.loadingSkeleton = page.getByTestId('skeleton-loader');
  }

  async goto() {
    await this.page.goto('/activities');
  }

  async clickAddActivity() {
    await this.addActivityButton.click();
  }

  async getActivityCards() {
    return this.page.getByTestId('activity-card').all();
  }

  async getActivityCardByIndex(index: number) {
    return this.page.getByTestId('activity-card').nth(index);
  }

  async isEmptyStateVisible() {
    return this.emptyState.isVisible();
  }

  async waitForActivitiesToLoad() {
    await this.loadingSkeleton.waitFor({ state: 'hidden' });
  }
}
```

### Example Page Object: ActivityFormModal

```typescript
// e2e/page-objects/activity-form-modal.ts
import type { Page, Locator } from '@playwright/test';

export class ActivityFormModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly dateTimeInput: Locator;
  readonly typeSelect: Locator;
  readonly durationInput: Locator;
  readonly distanceInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId('activity-form-modal');
    this.dateTimeInput = page.getByTestId('activity-date-input');
    this.typeSelect = page.getByTestId('activity-type-select');
    this.durationInput = page.getByTestId('duration-input');
    this.distanceInput = page.getByTestId('distance-input');
    this.submitButton = page.getByTestId('submit-activity-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.errorMessage = page.getByTestId('form-error-message');
  }

  async fillActivityForm(data: {
    dateTime: string;
    type: 'Run' | 'Walk' | 'Mixed';
    duration: string;
    distance?: string;
  }) {
    await this.dateTimeInput.fill(data.dateTime);
    await this.typeSelect.selectOption(data.type);
    await this.durationInput.fill(data.duration);
    if (data.distance) {
      await this.distanceInput.fill(data.distance);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async isVisible() {
    return this.modal.isVisible();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}
```

---

## User Stories and Test Scenarios

### User Story 1: View Activities List

**As a user**
**I want to** view my activities for the current month
**So that** I can track my recent running and walking activities

#### Acceptance Criteria

- Activities are displayed in a list grouped by date
- Most recent activities appear first (descending order)
- Each activity shows: type badge, time (24h format), duration, and distance
- Today's activities are marked with a "Today" badge
- Loading state shows skeleton loader
- Empty state shows when no activities exist

#### Test Scenarios

##### TC-E2E-001: Display activities for current month

```typescript
test('should display activities for current month', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);

  // Arrange: Seed test data
  const userId = await setupTestUser('test-user-001@example.com');
  await seedActivities(userId, [
    { date: '2025-11-30T14:30:00Z', type: 'Run', duration: 'PT45M', distance: 5000 },
    { date: '2025-11-29T09:00:00Z', type: 'Walk', duration: 'PT30M', distance: 3000 },
  ]);

  // Act
  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert
  const cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(2);

  // Verify first activity
  const firstCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(firstCard.getByTestId('activity-type-badge')).toHaveText('Run');
  await expect(firstCard.getByTestId('activity-time')).toContainText('14:30');
  await expect(firstCard.getByTestId('activity-duration')).toContainText('45m');
  await expect(firstCard.getByTestId('activity-distance')).toContainText('5.00 km');

  // Verify date grouping
  const dateHeaders = page.getByTestId('date-header');
  await expect(dateHeaders.first()).toContainText('Saturday, Nov 30');

  // Verify "Today" badge
  await expect(dateHeaders.first().getByTestId('today-badge')).toBeVisible();

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-002: Display empty state when no activities exist

```typescript
test('should display empty state when no activities exist', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);

  // Arrange: Clean database
  const userId = await setupTestUser('test-user-002@example.com');

  // Act
  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert
  expect(await activitiesPage.isEmptyStateVisible()).toBeTruthy();
  await expect(page.getByTestId('empty-state-message')).toContainText('No activities in November 2025');
  await expect(page.getByTestId('empty-state-cta')).toContainText('Add Activity');

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-003: Show loading state while fetching activities

```typescript
test('should show loading skeleton while fetching activities', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);

  // Arrange: Intercept API to delay response
  await page.route('**/api/activities*', async route => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    route.continue();
  });

  const userId = await setupTestUser('test-user-003@example.com');

  // Act
  await activitiesPage.goto();

  // Assert: Loading state
  await expect(activitiesPage.loadingSkeleton).toBeVisible();

  // Wait for load to complete
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Loading state hidden
  await expect(activitiesPage.loadingSkeleton).toBeHidden();

  // Cleanup
  await cleanupTestData(userId);
});
```

---

### User Story 2: Create New Activity

**As a user**
**I want to** create a new activity with details
**So that** I can log my completed runs and walks

#### Acceptance Criteria

- Clicking "Add Activity" opens a modal form
- Form requires: date/time, activity type, and duration
- Distance is optional
- Form validates inputs and shows error messages
- Optimistic update shows activity immediately
- Activity persists after page refresh

#### Test Scenarios

##### TC-E2E-004: Create activity with all fields

```typescript
test('should create activity with all fields', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-004@example.com');
  await activitiesPage.goto();

  // Act: Open form
  await activitiesPage.clickAddActivity();
  await expect(formModal.modal).toBeVisible();

  // Act: Fill form
  await formModal.fillActivityForm({
    dateTime: '2025-11-30T14:30',
    type: 'Run',
    duration: '01:45:00',
    distance: '12000',
  });

  await formModal.submit();

  // Assert: Modal closes
  await expect(formModal.modal).toBeHidden();

  // Assert: Optimistic update - activity appears immediately
  const cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(1);

  const newCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(newCard.getByTestId('activity-type-badge')).toHaveText('Run');
  await expect(newCard.getByTestId('activity-time')).toContainText('14:30');
  await expect(newCard.getByTestId('activity-duration')).toContainText('1h 45m');
  await expect(newCard.getByTestId('activity-distance')).toContainText('12.00 km');

  // Assert: Activity persists after refresh
  await page.reload();
  await activitiesPage.waitForActivitiesToLoad();
  const persistedCards = await activitiesPage.getActivityCards();
  expect(persistedCards).toHaveLength(1);

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-005: Create activity with required fields only

```typescript
test('should create activity with required fields only', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-005@example.com');
  await activitiesPage.goto();

  // Act
  await activitiesPage.clickAddActivity();
  await formModal.fillActivityForm({
    dateTime: '2025-11-30T09:00',
    type: 'Walk',
    duration: '00:30:00',
    // No distance
  });
  await formModal.submit();

  // Assert
  const newCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(newCard.getByTestId('activity-type-badge')).toHaveText('Walk');
  await expect(newCard.getByTestId('activity-distance')).toContainText('—'); // No distance indicator

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-006: Cancel activity creation

```typescript
test('should cancel activity creation without saving', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-006@example.com');
  await activitiesPage.goto();

  // Act: Open form and fill data
  await activitiesPage.clickAddActivity();
  await formModal.fillActivityForm({
    dateTime: '2025-11-30T14:30',
    type: 'Run',
    duration: '01:00:00',
  });

  // Act: Cancel
  await formModal.cancel();

  // Assert: Modal closes
  await expect(formModal.modal).toBeHidden();

  // Assert: No activity created
  expect(await activitiesPage.isEmptyStateVisible()).toBeTruthy();

  // Cleanup
  await cleanupTestData(userId);
});
```

---

### User Story 3: Edit Existing Activity

**As a user**
**I want to** edit an existing activity
**So that** I can correct mistakes or update details

#### Acceptance Criteria

- Clicking edit button on activity card opens form modal
- Form pre-fills with existing activity data
- Updating fields and saving updates the activity
- Optimistic update shows changes immediately
- Changes persist after page refresh

#### Test Scenarios

##### TC-E2E-007: Edit activity and update all fields

```typescript
test('should edit activity and update all fields', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange: Create initial activity
  const userId = await setupTestUser('test-user-007@example.com');
  await seedActivity(userId, {
    date: '2025-11-30T14:30:00Z',
    type: 'Walk',
    duration: 'PT30M',
    distance: 3000,
  });

  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Act: Click edit button
  const card = await activitiesPage.getActivityCardByIndex(0);
  await card.getByTestId('edit-activity-button').click();

  // Assert: Modal opens with pre-filled data
  await expect(formModal.modal).toBeVisible();
  await expect(formModal.typeSelect).toHaveValue('Walk');
  await expect(formModal.durationInput).toHaveValue('00:30:00');
  await expect(formModal.distanceInput).toHaveValue('3000');

  // Act: Update fields
  await formModal.typeSelect.selectOption('Run');
  await formModal.durationInput.fill('00:45:00');
  await formModal.distanceInput.fill('5000');
  await formModal.submit();

  // Assert: Optimistic update
  await expect(formModal.modal).toBeHidden();
  const updatedCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(updatedCard.getByTestId('activity-type-badge')).toHaveText('Run');
  await expect(updatedCard.getByTestId('activity-duration')).toContainText('45m');
  await expect(updatedCard.getByTestId('activity-distance')).toContainText('5.00 km');

  // Assert: Changes persist
  await page.reload();
  await activitiesPage.waitForActivitiesToLoad();
  const persistedCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(persistedCard.getByTestId('activity-type-badge')).toHaveText('Run');

  // Cleanup
  await cleanupTestData(userId);
});
```

---

### User Story 4: Delete Activity

**As a user**
**I want to** delete an activity with confirmation
**So that** I can remove activities logged by mistake

#### Acceptance Criteria

- Clicking delete button opens confirmation modal
- Modal shows activity details for verification
- Confirming deletion removes activity immediately (optimistic update)
- Canceling deletion keeps the activity
- Deletion persists after page refresh

#### Test Scenarios

##### TC-E2E-008: Delete activity with confirmation

```typescript
test('should delete activity after confirmation', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const deleteModal = new DeleteConfirmationModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-008@example.com');
  await seedActivities(userId, [
    { date: '2025-11-30T14:30:00Z', type: 'Run', duration: 'PT45M', distance: 5000 },
    { date: '2025-11-29T09:00:00Z', type: 'Walk', duration: 'PT30M', distance: 3000 },
  ]);

  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Act: Click delete on first activity
  const firstCard = await activitiesPage.getActivityCardByIndex(0);
  await firstCard.getByTestId('delete-activity-button').click();

  // Assert: Confirmation modal appears with activity details
  await expect(deleteModal.modal).toBeVisible();
  await expect(deleteModal.activityPreview).toContainText('Run');
  await expect(deleteModal.activityPreview).toContainText('Saturday, Nov 30');
  await expect(deleteModal.activityPreview).toContainText('45m');

  // Act: Confirm deletion
  await deleteModal.confirm();

  // Assert: Modal closes
  await expect(deleteModal.modal).toBeHidden();

  // Assert: Optimistic update - activity removed immediately
  const remainingCards = await activitiesPage.getActivityCards();
  expect(remainingCards).toHaveLength(1);

  // Assert: Correct activity remains
  const remainingCard = await activitiesPage.getActivityCardByIndex(0);
  await expect(remainingCard.getByTestId('activity-type-badge')).toHaveText('Walk');

  // Assert: Deletion persists
  await page.reload();
  await activitiesPage.waitForActivitiesToLoad();
  const persistedCards = await activitiesPage.getActivityCards();
  expect(persistedCards).toHaveLength(1);

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-009: Cancel activity deletion

```typescript
test('should cancel deletion and keep activity', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const deleteModal = new DeleteConfirmationModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-009@example.com');
  await seedActivity(userId, {
    date: '2025-11-30T14:30:00Z',
    type: 'Run',
    duration: 'PT45M',
    distance: 5000,
  });

  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Act: Click delete
  const card = await activitiesPage.getActivityCardByIndex(0);
  await card.getByTestId('delete-activity-button').click();
  await expect(deleteModal.modal).toBeVisible();

  // Act: Cancel
  await deleteModal.cancel();

  // Assert: Modal closes
  await expect(deleteModal.modal).toBeHidden();

  // Assert: Activity remains
  const cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(1);
  await expect(card.getByTestId('activity-type-badge')).toHaveText('Run');

  // Cleanup
  await cleanupTestData(userId);
});
```

---

### User Story 5: Navigate Between Months

**As a user**
**I want to** navigate between different months
**So that** I can view my activity history

#### Acceptance Criteria

- Previous/next buttons navigate to adjacent months
- "Today" button returns to current month
- Clicking month/year label opens picker modal
- Month picker allows selecting any month/year
- Activity list updates to show selected month's activities
- Navigation buttons disable at min/max boundaries

#### Test Scenarios

##### TC-E2E-010: Navigate to previous and next months

```typescript
test('should navigate to previous and next months', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const monthNav = new MonthNavigation(page);

  // Arrange
  const userId = await setupTestUser('test-user-010@example.com');
  await seedActivities(userId, [
    { date: '2025-11-30T14:30:00Z', type: 'Run', duration: 'PT45M' },    // November
    { date: '2025-10-15T09:00:00Z', type: 'Walk', duration: 'PT30M' },   // October
    { date: '2025-12-05T10:00:00Z', type: 'Run', duration: 'PT60M' },    // December
  ]);

  await activitiesPage.goto();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Current month is November 2025
  await expect(monthNav.monthDisplay).toContainText('November 2025');
  let cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(1); // Only November activity

  // Act: Click previous month
  await monthNav.clickPrevious();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Shows October 2025
  await expect(monthNav.monthDisplay).toContainText('October 2025');
  cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(1); // Only October activity

  // Act: Click next twice to get to December
  await monthNav.clickNext();
  await activitiesPage.waitForActivitiesToLoad();
  await monthNav.clickNext();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Shows December 2025
  await expect(monthNav.monthDisplay).toContainText('December 2025');
  cards = await activitiesPage.getActivityCards();
  expect(cards).toHaveLength(1); // Only December activity

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-011: Return to current month with "Today" button

```typescript
test('should return to current month with Today button', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const monthNav = new MonthNavigation(page);

  // Arrange
  const userId = await setupTestUser('test-user-011@example.com');
  await activitiesPage.goto();

  // Act: Navigate to past month
  await monthNav.clickPrevious();
  await monthNav.clickPrevious();
  await monthNav.clickPrevious();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Not on current month
  await expect(monthNav.monthDisplay).not.toContainText('November 2025');
  await expect(monthNav.todayButton).toBeEnabled();

  // Act: Click Today button
  await monthNav.clickToday();
  await activitiesPage.waitForActivitiesToLoad();

  // Assert: Returns to current month
  await expect(monthNav.monthDisplay).toContainText('November 2025');

  // Assert: Today button disabled when on current month
  await expect(monthNav.todayButton).toBeDisabled();

  // Cleanup
  await cleanupTestData(userId);
});
```

---

### User Story 6: Form Validation and Error Handling

**As a user**
**I want to** receive clear validation messages
**So that** I can correct errors and successfully create/edit activities

#### Acceptance Criteria

- Invalid date formats show error message
- Zero or negative durations are rejected
- Negative distances are rejected
- Error messages are accessible (ARIA attributes)
- Server errors show user-friendly messages
- Network errors allow retry

#### Test Scenarios

##### TC-E2E-012: Validate duration constraints

```typescript
test('should reject zero and negative durations', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-012@example.com');
  await activitiesPage.goto();
  await activitiesPage.clickAddActivity();

  // Test Case 1: Zero duration
  await formModal.fillActivityForm({
    dateTime: '2025-11-30T14:30',
    type: 'Run',
    duration: '00:00:00',
  });
  await formModal.submit();

  await expect(page.getByTestId('duration-error-message')).toContainText('Duration must be greater than 0');

  // Test Case 2: Invalid format
  await formModal.durationInput.fill('invalid');
  await formModal.submit();

  await expect(page.getByTestId('duration-error-message')).toContainText('Invalid duration format');

  // Cleanup
  await cleanupTestData(userId);
});
```

##### TC-E2E-013: Validate distance constraints

```typescript
test('should reject negative distances', async ({ page }) => {
  const activitiesPage = new ActivitiesPage(page);
  const formModal = new ActivityFormModal(page);

  // Arrange
  const userId = await setupTestUser('test-user-013@example.com');
  await activitiesPage.goto();
  await activitiesPage.clickAddActivity();

  // Act: Enter negative distance
  await formModal.fillActivityForm({
    dateTime: '2025-11-30T14:30',
    type: 'Run',
    duration: '00:45:00',
    distance: '-1000',
  });
  await formModal.submit();

  // Assert: Validation error
  await expect(page.getByTestId('distance-error-message')).toContainText('Distance must be 0 or greater');
  await expect(formModal.distanceInput).toHaveAttribute('aria-invalid', 'true');

  // Cleanup
  await cleanupTestData(userId);
});
```

---

## Data Test IDs Reference

### Activities Page Components

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Main container | `activities-page-container` | Root container |
| Add button | `add-activity-button` | Opens activity form |
| Activity list | `activity-list` | List container |
| Activity card | `activity-card` | Individual activity |
| Empty state | `empty-state` | No activities message |
| Skeleton loader | `skeleton-loader` | Loading state |
| Error banner | `error-banner` | Error message display |

### Activity Card Components

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Type badge | `activity-type-badge` | Run/Walk/Mixed badge |
| Time display | `activity-time` | 24h format time |
| Duration | `activity-duration` | Duration (e.g., "1h 30m") |
| Distance | `activity-distance` | Distance in km/mi |
| Edit button | `edit-activity-button` | Opens edit form |
| Delete button | `delete-activity-button` | Opens delete modal |

### Month Navigation Components

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Navigation bar | `month-navigation` | Month selector bar |
| Previous button | `previous-month-button` | Go to previous month |
| Next button | `next-month-button` | Go to next month |
| Month display | `month-display` | Clickable month/year |
| Today button | `today-button` | Return to current month |

### Activity Form Modal

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Modal | `activity-form-modal` | Form dialog |
| Date input | `activity-date-input` | Date/time picker |
| Type select | `activity-type-select` | Activity type dropdown |
| Duration input | `duration-input` | Duration field (HH:MM:SS) |
| Distance input | `distance-input` | Distance in meters |
| Submit button | `submit-activity-button` | Create/Update button |
| Cancel button | `cancel-button` | Cancel and close |
| Error message | `form-error-message` | Form-level errors |
| Field errors | `{field}-error-message` | Field-specific errors |

### Delete Confirmation Modal

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Modal | `delete-confirmation-modal` | Confirmation dialog |
| Activity preview | `activity-preview` | Activity details |
| Confirm button | `confirm-delete-button` | Confirm deletion |
| Cancel button | `cancel-delete-button` | Cancel deletion |

### Date Header

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Header | `date-header` | Date section header |
| Today badge | `today-badge` | "Today" indicator |

### Month Picker Modal

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Modal | `month-picker-modal` | Month/year picker |
| Month select | `month-select` | Month dropdown |
| Year select | `year-select` | Year dropdown |
| Confirm button | `confirm-month-button` | Confirm selection |
| Cancel button | `cancel-month-button` | Cancel selection |

### Empty State

| Component | data-testid | Description |
|-----------|-------------|-------------|
| Message | `empty-state-message` | No activities message |
| CTA button | `empty-state-cta` | Add activity button |

---

## Test Execution Strategy

### Local Development

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/tests/activity-creation.spec.ts

# Run tests in UI mode
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug e2e/tests/activity-creation.spec.ts
```

### Continuous Integration (GitHub Actions)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
          SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.E2E_SUPABASE_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Execution Order

1. **Smoke Tests** (critical path): Run first to catch major issues
   - TC-E2E-001: Display activities
   - TC-E2E-004: Create activity
   - TC-E2E-007: Edit activity
   - TC-E2E-008: Delete activity

2. **Full Regression Suite**: Run all tests in parallel

3. **Visual Regression**: Run screenshot comparisons

### Parallel Execution

- Configure Playwright workers for parallel execution
- Ensure tests are independent (no shared state)
- Use separate test users for each test
- Clean up test data after each test

---

## Acceptance Criteria

### Test Coverage

- ✅ **100% of critical user flows** covered by E2E tests
- ✅ **All CRUD operations** tested with optimistic updates
- ✅ **Form validation** for all input fields
- ✅ **Error handling** for network and server errors
- ✅ **Accessibility** attributes verified (ARIA)
- ✅ **Responsive design** tested on mobile/tablet/desktop

### Quality Gates

- ✅ **All tests pass** in CI pipeline before merge
- ✅ **No flaky tests** (tests pass consistently)
- ✅ **Test execution time** < 5 minutes for full suite
- ✅ **Screenshot comparisons** have < 0.1% pixel difference
- ✅ **Code coverage** from E2E tests > 70% of frontend code

### Performance Benchmarks

- Page load time < 2 seconds
- Optimistic updates appear < 100ms
- API responses < 200ms (remote test database)
- No memory leaks during test execution

---

## Implementation Roadmap

### Phase 1: Setup (Week 1)
- [ ] Install Playwright and configure
- [ ] Set up test database helpers
- [ ] Create base Page Object Models
- [ ] **Add all data-testid attributes to components**
- [ ] Verify test environment configuration

### Phase 2: Core Tests (Week 2)
- [ ] Implement User Story 1 tests (View Activities)
- [ ] Implement User Story 2 tests (Create Activity)
- [ ] Implement User Story 4 tests (Delete Activity)

### Phase 3: Advanced Tests (Week 3)
- [ ] Implement User Story 3 tests (Edit Activity)
- [ ] Implement User Story 5 tests (Month Navigation)
- [ ] Implement User Story 6 tests (Form Validation)

### Phase 4: CI/CD Integration (Week 4)
- [ ] Set up GitHub Actions workflow
- [ ] Configure test reporting
- [ ] Add visual regression tests
- [ ] Performance benchmarking

---

## Maintenance and Best Practices

### Test Maintenance

1. **Keep tests independent**: No shared state between tests
2. **Use test fixtures**: Reusable test data and setup
3. **Update selectors**: Maintain data-testid attributes when refactoring
4. **Review failures**: Investigate and fix flaky tests immediately
5. **Update documentation**: Keep test plan in sync with features

### Debugging Failed Tests

```bash
# Run with trace
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip

# Run specific test with debug
npx playwright test --debug -g "should create activity"
```

### Code Review Checklist

- [ ] All new features have corresponding E2E tests
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] data-testid attributes added to new components
- [ ] Page Object Models updated
- [ ] Tests are independent and can run in parallel
- [ ] Test names clearly describe the scenario
- [ ] Assertions are specific and meaningful
- [ ] Test data cleanup implemented

---

**Document Status:** Living Document
**Next Review Date:** 2025-12-30
**Maintained By:** QA Team

**References:**
- [Playwright Documentation](https://playwright.dev)
- [Test Plan](../.ai/test-plan.md)
- [Activities View Implementation](../.ai/workloads/activities-view-initial-implementation.md)
- [Playwright E2E Testing Rules](../.cursor/rules/playwright-e2e-testing.mdc)