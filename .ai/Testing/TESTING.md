# Testing Guide - AstroRunner

This document covers the testing infrastructure set up for unit tests, integration tests, and E2E tests in the AstroRunner project.

## Overview

The project uses a comprehensive testing stack:

- **Unit & Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **API Mocking**: MSW (Mock Service Worker)
- **DOM Testing Utilities**: @testing-library/jest-dom, @testing-library/user-event

## Table of Contents

1. [Unit and Integration Tests (Vitest)](#unit-and-integration-tests-vitest)
2. [E2E Tests (Playwright)](#e2e-tests-playwright)
3. [Running Tests](#running-tests)
4. [Test File Organization](#test-file-organization)
5. [Coverage Requirements](#coverage-requirements)

---

## Unit and Integration Tests (Vitest)

### Configuration

- **Config File**: `vitest.config.ts`
- **Setup File**: `vitest.setup.ts`
- **TypeScript Config**: `tsconfig.vitest.json`

### Key Features

- **Fast Execution**: ESM-native test framework
- **Watch Mode**: Instant feedback during development
- **UI Mode**: Visual test explorer (`npm run test:ui`)
- **TypeScript Support**: Full type checking in tests
- **jsdom Environment**: DOM simulation for component testing
- **Global Matchers**: Vitest globals enabled (`describe`, `it`, `expect`)

### Test Patterns

Tests follow the **Arrange-Act-Assert** pattern:

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    // Arrange
    const props = { title: "Test" };

    // Act
    render(<MyComponent {...props} />);

    // Assert
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### Service Testing

Services are tested by mocking the Supabase client:

```typescript
// src/lib/services/__tests__/activity.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { createActivity } from "../activity.service";

describe("createActivity", () => {
  it("validates input before inserting", () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: [...], error: null }),
      }),
    };

    // Test implementation
  });
});
```

### Mocking Patterns

#### Function Mocks
```typescript
const mockFn = vi.fn();
const mockFnWithReturnValue = vi.fn().mockReturnValue("value");
const mockAsync = vi.fn().mockResolvedValue({ data: [...] });
```

#### Module Mocks
```typescript
vi.mock("../module", () => ({
  functionName: vi.fn().mockReturnValue("mocked"),
}));
```

#### Spies
```typescript
const spy = vi.spyOn(module, "functionName");
expect(spy).toHaveBeenCalledWith(expectedArg);
spy.mockRestore();
```

### Coverage Thresholds

Default coverage targets (configurable in `vitest.config.ts`):
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 75%
- **Statements**: 80%

Excluded from coverage:
- Type definition files (`*.d.ts`)
- Test files themselves
- Type-only exports

---

## E2E Tests (Playwright)

### Configuration

- **Config File**: `playwright.config.ts`
- **Test Directory**: `e2e/`
- **Page Objects**: `e2e/page-objects/`

### Key Features

- **Single Browser**: Chromium/Desktop Chrome only
- **Visual Testing**: Screenshot comparison on failures
- **Traces & Videos**: Automatic recording on failures
- **Parallel Execution**: Tests run in parallel by default (CI: sequential)
- **Auto-Retries**: Retries on CI for flaky tests
- **Page Object Model**: Maintainable test structure

### Test Pattern

E2E tests follow Arrange-Act-Assert and use Page Object Model:

```typescript
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test.describe("Login Flow", () => {
  test("user can log in with valid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.goto();
    await loginPage.fillEmail("test@example.com");
    await loginPage.fillPassword("password");
    await loginPage.clickSignIn();

    // Assert
    await expect(loginPage.successMessage).toBeVisible();
  });
});
```

### Page Object Pattern

Create reusable page objects in `e2e/page-objects/`:

```typescript
// e2e/page-objects/LoginPage.ts
import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  get emailInput() {
    return this.page.getByTestId("email-input");
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async clickSignIn() {
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }

  get successMessage() {
    return this.page.getByText("Login successful");
  }
}
```

### Test Data Management

Use `test.beforeEach()` for setup and `test.afterEach()` for cleanup:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup: Create test user, seed data, etc.
  await seedTestUser();
});

test.afterEach(async ({ page }) => {
  // Cleanup: Remove test data
  await cleanupTestData();
});
```

### Browser Contexts

Use browser contexts to isolate test environments:

```typescript
test("isolated test", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  // ... test code
  await context.close();
});
```

---

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI (visual explorer)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm run test -- src/components/__tests__/MyComponent.test.tsx

# Run tests matching pattern
npm run test -- -t "MyComponent"

# Run with debug logging
npm run test -- --reporter=verbose
```

### E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run E2E tests in debug mode (step through)
npm run e2e:debug

# Run E2E tests with UI (visual explorer)
npm run e2e:ui

# Run E2E tests with browser visible
npm run e2e:headed

# Run specific test file
npm run e2e -- e2e/login.spec.ts

# Run tests matching pattern
npm run e2e -- -g "login"
```

### CI Environment

The testing setup detects CI automatically:

```bash
# In CI, tests:
# - Run sequentially (not in parallel)
# - Retry twice on failure
# - Generate detailed reports (HTML, JSON, JUnit XML)
```

To simulate CI locally:
```bash
CI=true npm run e2e
```

---

## Test File Organization

### Unit Tests

```
src/
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
├── lib/
│   ├── services/
│   │   ├── activity.service.ts
│   │   └── __tests__/
│   │       └── activity.service.test.ts
│   ├── mappers/
│   │   ├── activity.mapper.ts
│   │   └── __tests__/
│   │       └── activity.mapper.test.ts
│   └── validators.ts
```

### E2E Tests

```
e2e/
├── page-objects/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── ActivityPage.ts
│   └── SettingsPage.ts
├── auth.spec.ts
├── activities.spec.ts
└── navigation.spec.ts
```

### Test File Naming

- **Unit/Integration**: `*.test.ts` or `*.test.tsx`
- **E2E**: `*.spec.ts`
- **Test Directories**: `__tests__/` (co-located with source)

---

## Coverage Requirements

### Viewing Coverage

```bash
# Generate and open HTML coverage report
npm run test:coverage
# Open coverage/index.html in browser
```

### Understanding Coverage Metrics

- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of conditional branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Coverage Targets by Area

| Area | Target | Notes |
|------|--------|-------|
| Services | 90% | Business logic - high coverage critical |
| Mappers | 85% | Data transformation - test edge cases |
| Validators | 80% | Use Zod's safeParse for coverage |
| Components | 75% | Interactive elements + state |
| Utilities | 80% | Pure functions |

### Improving Coverage

1. **Identify gaps**: Run coverage, check report for red lines
2. **Test edge cases**: Error paths, boundary conditions
3. **Use snapshots carefully**: Only for complex output
4. **Mock external dependencies**: Supabase, OpenRouter
5. **Test user interactions**: Click, type, submit

---

## Debugging Tips

### Vitest Debugging

```typescript
// Add breakpoints and use Node debugger
node --inspect-brk node_modules/vitest/vitest.mjs run src/__tests__/example.test.ts

// Or use VS Code debugger with launch config
```

### Playwright Debugging

```bash
# Step through tests with inspector
npm run e2e:debug

# View trace after test failure
npx playwright show-trace test-results/trace.zip

# Take screenshots during test
await page.screenshot({ path: 'screenshot.png' });
```

### Common Issues

**Tests timing out**: Increase `timeout` in vitest.config.ts or playwright.config.ts

**Mock not working**: Ensure `vi.mock()` is at top level, before imports

**E2E test flakiness**: Use specific locators (data-testid), add waits, avoid hard timeouts

---

## Best Practices

### Do's ✅

- ✅ Write tests for critical user flows
- ✅ Use descriptive test names: `"should update activity when form is submitted"`
- ✅ Mock external dependencies (Supabase, OpenRouter)
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Use `data-testid` attributes for E2E test selectors
- ✅ Test error states and edge cases
- ✅ Keep tests focused on one behavior
- ✅ Use Page Objects for E2E tests

### Don'ts ❌

- ❌ Don't test implementation details, test behavior
- ❌ Don't use hardcoded waits (use expect with retry)
- ❌ Don't disable type checking in tests
- ❌ Don't skip E2E tests for "obvious" features
- ❌ Don't test third-party libraries (mock them)
- ❌ Don't make tests dependent on each other
- ❌ Don't test `console.log` unless it's critical

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev)
- [MSW Documentation](https://mswjs.io)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about#priority)

---

## Contributing Tests

When implementing tests:

1. Read the [CLAUDE.md](./CLAUDE.md) testing strategy section
2. Follow patterns in existing tests
3. Ensure tests pass locally before committing
4. Maintain coverage thresholds
5. Update this document if adding new patterns

---

**Last Updated**: 2025-11-23
