# Test Templates - Quick Start Examples

This document contains copy-paste templates to help you start writing tests quickly.

---

## Table of Contents

1. [Service Tests](#service-tests)
2. [Component Tests](#component-tests)
3. [Mapper Tests](#mapper-tests)
4. [Validator Tests](#validator-tests)
5. [E2E Tests](#e2e-tests)
6. [Page Objects](#page-objects)

---

## Service Tests

### Template: Basic Service Test

**File**: `src/lib/services/__tests__/example.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { exampleFunction } from "../example.service";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the Supabase client
vi.mock("@supabase/supabase-js");

describe("exampleFunction", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({
          data: [{ id: "123", name: "Test" }],
          error: null,
        }),
      }),
    };
  });

  it("should return data when query succeeds", async () => {
    // Arrange
    const testData = [{ id: "1", name: "Activity 1" }];
    mockSupabase.from().select().mockResolvedValue({
      data: testData,
      error: null,
    });

    // Act
    const result = await exampleFunction(mockSupabase);

    // Assert
    expect(result).toEqual(testData);
  });

  it("should throw error when query fails", async () => {
    // Arrange
    mockSupabase.from().select().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    // Act & Assert
    await expect(exampleFunction(mockSupabase)).rejects.toThrow(
      "Database error"
    );
  });

  it("should validate input before querying", async () => {
    // Arrange
    const invalidInput = null;

    // Act & Assert
    expect(() => exampleFunction(mockSupabase, invalidInput)).toThrow(
      "Input is required"
    );
  });
});
```

---

## Component Tests

### Template: React Component Test

**File**: `src/components/__tests__/ExampleComponent.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExampleComponent from "../ExampleComponent";

describe("ExampleComponent", () => {
  it("should render with default props", () => {
    // Arrange & Act
    render(<ExampleComponent title="Test Title" />);

    // Assert
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    // Arrange
    const handleClick = vi.fn();
    render(<ExampleComponent onSubmit={handleClick} />);
    const user = userEvent.setup();

    // Act
    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should display error message when prop is provided", () => {
    // Arrange & Act
    render(<ExampleComponent error="Something went wrong" />);

    // Assert
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should update when props change", () => {
    // Arrange
    const { rerender } = render(
      <ExampleComponent label="Initial Label" />
    );
    expect(screen.getByText("Initial Label")).toBeInTheDocument();

    // Act
    rerender(<ExampleComponent label="Updated Label" />);

    // Assert
    expect(screen.queryByText("Initial Label")).not.toBeInTheDocument();
    expect(screen.getByText("Updated Label")).toBeInTheDocument();
  });
});
```

### Template: Component with Form

**File**: `src/components/__tests__/FormComponent.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormComponent from "../FormComponent";

describe("FormComponent", () => {
  it("should submit form with valid data", async () => {
    // Arrange
    const handleSubmit = vi.fn();
    render(<FormComponent onSubmit={handleSubmit} />);
    const user = userEvent.setup();

    // Act
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    // Assert
    expect(handleSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  it("should display validation errors", async () => {
    // Arrange
    render(<FormComponent onSubmit={vi.fn()} />);
    const user = userEvent.setup();

    // Act
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    // Assert
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

---

## Mapper Tests

### Template: DTO Mapper Test

**File**: `src/lib/mappers/__tests__/example.mapper.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { mapEntityToDto, mapCommandToEntity } from "../example.mapper";
import type { ExampleEntity, ExampleDto, ExampleCommand } from "@/types";

describe("exampleMapper", () => {
  describe("mapEntityToDto", () => {
    it("should map database entity to DTO", () => {
      // Arrange
      const entity: ExampleEntity = {
        id: "123",
        name: "Test",
        created_at: "2025-11-23T00:00:00Z",
      };

      // Act
      const dto = mapEntityToDto(entity);

      // Assert
      expect(dto).toEqual({
        id: "123",
        name: "Test",
        createdAt: "2025-11-23T00:00:00Z",
      });
      expect(dto.created_at).toBeUndefined();
    });

    it("should handle optional fields", () => {
      // Arrange
      const entity: ExampleEntity = {
        id: "123",
        name: "Test",
        created_at: "2025-11-23T00:00:00Z",
        description: undefined,
      };

      // Act
      const dto = mapEntityToDto(entity);

      // Assert
      expect(dto.description).toBeUndefined();
    });
  });

  describe("mapCommandToEntity", () => {
    it("should map command to entity with user context", () => {
      // Arrange
      const command: ExampleCommand = {
        name: "Test",
        description: "Test description",
      };
      const userId = "user-123";

      // Act
      const entity = mapCommandToEntity(command, userId);

      // Assert
      expect(entity.name).toBe("Test");
      expect(entity.description).toBe("Test description");
      expect(entity.user_id).toBe("user-123");
    });
  });
});
```

---

## Validator Tests

### Template: Zod Validator Test

**File**: `src/lib/__tests__/validators.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { createActivityCommandSchema, validateIsoDate } from "../validators";

describe("Validators", () => {
  describe("createActivityCommandSchema", () => {
    it("should validate correct input", () => {
      // Arrange
      const input = {
        activityDate: "2025-11-23T10:00:00Z",
        duration: "01:30:00",
        activityType: "Run",
        distance: 5000,
      };

      // Act
      const result = createActivityCommandSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityDate).toBe(input.activityDate);
      }
    });

    it("should reject invalid activity type", () => {
      // Arrange
      const input = {
        activityDate: "2025-11-23T10:00:00Z",
        duration: "01:30:00",
        activityType: "InvalidType",
        distance: 5000,
      };

      // Act
      const result = createActivityCommandSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should return detailed validation errors", () => {
      // Arrange
      const input = {
        activityDate: "invalid-date",
        duration: "invalid-duration",
        activityType: "Run",
      };

      // Act
      const result = createActivityCommandSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].path).toBeDefined();
      }
    });
  });

  describe("validateIsoDate", () => {
    it("should accept valid ISO dates", () => {
      // Arrange
      const validDates = [
        "2025-11-23T10:00:00Z",
        "2025-11-23T10:00:00.000Z",
      ];

      // Act & Assert
      validDates.forEach((date) => {
        expect(() => validateIsoDate(date)).not.toThrow();
      });
    });

    it("should reject invalid dates", () => {
      // Arrange
      const invalidDates = [
        "2025-13-45T10:00:00Z",
        "not-a-date",
        "2025-11-23",
      ];

      // Act & Assert
      invalidDates.forEach((date) => {
        expect(() => validateIsoDate(date)).toThrow();
      });
    });
  });
});
```

---

## E2E Tests

### Template: Basic E2E Test

**File**: `e2e/example.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { ActivityPage } from "./page-objects/ActivityPage";

test.describe("Activity Management", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to login and authenticate
    await page.goto("/login");
  });

  test("user can view activity list", async ({ page }) => {
    // Arrange
    const activityPage = new ActivityPage(page);

    // Act
    await page.goto("/activities");

    // Assert
    await expect(activityPage.pageTitle).toBeVisible();
    await expect(activityPage.activityList).toBeVisible();
  });

  test("user can create new activity", async ({ page }) => {
    // Arrange
    const activityPage = new ActivityPage(page);

    // Act
    await page.goto("/activities");
    await activityPage.clickCreateButton();
    await activityPage.fillActivityForm({
      date: "2025-11-23",
      duration: "01:30",
      type: "Run",
      distance: "5.0",
    });
    await activityPage.submitForm();

    // Assert
    await expect(activityPage.successMessage).toBeVisible();
  });

  test("user can filter activities by type", async ({ page }) => {
    // Arrange
    const activityPage = new ActivityPage(page);

    // Act
    await page.goto("/activities");
    await activityPage.selectActivityType("Run");

    // Assert
    const activities = await activityPage.getActivityCards();
    for (const activity of activities) {
      await expect(activity.locator("[data-testid='type']")).toHaveText("Run");
    }
  });
});
```

---

## Page Objects

### Template: Base Page Object

**File**: `e2e/page-objects/BasePage.ts`

```typescript
import type { Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForNavigation() {
    await this.page.waitForNavigation();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.isVisible(selector);
  }
}
```

### Template: Feature Page Object

**File**: `e2e/page-objects/ActivityPage.ts`

```typescript
import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ActivityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Getters for page elements
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /activities/i });
  }

  get activityList(): Locator {
    return this.page.getByTestId("activity-list");
  }

  get createButton(): Locator {
    return this.page.getByRole("button", { name: /create activity/i });
  }

  get successMessage(): Locator {
    return this.page.getByText(/successfully created/i);
  }

  // Action methods
  async clickCreateButton() {
    await this.createButton.click();
  }

  async selectActivityType(type: string) {
    await this.page.getByLabel(/activity type/i).selectOption(type);
    await this.page.waitForLoadState("networkidle");
  }

  async fillActivityForm(data: {
    date: string;
    duration: string;
    type: string;
    distance: string;
  }) {
    await this.page.getByLabel(/activity date/i).fill(data.date);
    await this.page.getByLabel(/duration/i).fill(data.duration);
    await this.page.getByLabel(/activity type/i).selectOption(data.type);
    await this.page
      .getByLabel(/distance/i)
      .fill(data.distance);
  }

  async submitForm() {
    await this.page
      .getByRole("button", { name: /submit/i })
      .click();
  }

  async getActivityCards(): Promise<Locator[]> {
    return this.page.getByTestId("activity-card").all();
  }
}
```

---

## Tips for Using Templates

1. **Copy and paste**: Find the template closest to your use case
2. **Customize names**: Replace `Example`, `example`, `ExampleComponent` with your actual names
3. **Adapt patterns**: Adjust mocking strategy based on your actual code
4. **Follow AAA**: Always use Arrange-Act-Assert pattern
5. **Use data-testid**: Add `data-testid` attributes to elements for reliable E2E selectors

---

## Running Your First Test

```bash
# Copy a template to your project
# Customize it for your component/service

# Run tests in watch mode
npm run test:watch

# When ready, run E2E tests
npm run e2e
```

---

For more details on testing patterns, see [TESTING.md](./TESTING.md)
