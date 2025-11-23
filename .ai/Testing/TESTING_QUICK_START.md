# Testing Quick Start Guide

**Status**: ✅ Testing environment fully configured and ready to use

---

## What's Been Set Up

Your project now has a complete testing infrastructure for unit, integration, and E2E testing:

- ✅ **Vitest** configured with TypeScript support
- ✅ **React Testing Library** for component testing
- ✅ **Playwright** for E2E testing
- ✅ **MSW** for API mocking
- ✅ **npm scripts** for running tests
- ✅ **Coverage reporting** enabled
- ✅ **Documentation** provided

---

## 📁 Key Files Created

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration (jsdom, coverage, TypeScript) |
| `vitest.setup.ts` | Global test setup (matchers, env mocks) |
| `playwright.config.ts` | Playwright E2E configuration (Chrome only) |
| `tsconfig.vitest.json` | TypeScript config for tests |
| `src/__tests__/unit/` | Unit test directory |
| `src/__tests__/integration/` | Integration test directory |
| `e2e/page-objects/` | Page Object Model classes |
| `TESTING.md` | Comprehensive testing guide |
| `TEST_TEMPLATES.md` | Copy-paste test templates |
| `TESTING_CHECKLIST.md` | Implementation checklist |

---

## 🚀 Run Tests Now

### Unit & Integration Tests

```bash
# Run tests once
npm run test

# Watch mode (recommended during development)
npm run test:watch

# Visual explorer
npm run test:ui

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run e2e

# Debug mode (step through)
npm run e2e:debug

# With visible browser
npm run e2e:headed

# Visual explorer
npm run e2e:ui
```

---

## 📖 Documentation

Read these in order:

1. **[TESTING.md](./TESTING.md)** - Complete testing guide with patterns
2. **[TEST_TEMPLATES.md](./TEST_TEMPLATES.md)** - Copy-paste code examples
3. **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Track your progress

---

## 💡 First Steps

### 1. Pick a Component or Service
Start small - choose one service or component to test first.

### 2. Copy a Template
Find the matching template in [TEST_TEMPLATES.md](./TEST_TEMPLATES.md):
- Service → use "Service Test Template"
- Component → use "React Component Test Template"
- Mapper → use "DTO Mapper Test Template"

### 3. Customize for Your Code
Replace names and adapt to your actual code structure.

### 4. Run in Watch Mode
```bash
npm run test:watch

# Will watch for changes and re-run tests automatically
```

### 5. Check Coverage
```bash
npm run test:coverage

# Opens coverage report at coverage/index.html
```

---

## 🎯 Testing Structure

### Unit Tests (Service Layer)
```
src/lib/services/__tests__/
├── activity.service.test.ts
├── openrouter.service.test.ts
└── ...
```

**What to test**: Business logic, validation, error handling

### Component Tests
```
src/components/__tests__/
├── ActivityFormModal.test.tsx
├── ActivityCard.test.tsx
└── ...
```

**What to test**: Rendering, user interactions, state changes

### E2E Tests (User Flows)
```
e2e/
├── page-objects/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── ActivityPage.ts
├── auth.spec.ts
├── activities.spec.ts
└── navigation.spec.ts
```

**What to test**: Complete user journeys, critical flows

---

## 🔍 Common Commands Reference

```bash
# Development workflow
npm run dev                    # Start app
npm run test:watch           # Run tests in watch mode
npm run lint:fix             # Fix linting

# Running tests
npm run test                  # All unit/integration tests
npm run e2e                   # All E2E tests
npm run test:coverage        # Coverage report

# Debugging
npm run test:ui              # Visual test explorer
npm run e2e:debug            # Step through E2E tests
npm run e2e:headed           # See browser during E2E tests

# Code quality
npm run lint                  # Check for linting issues
npm run format               # Format code with Prettier
```

---

## 📝 Example Test Structure

Every test follows **Arrange-Act-Assert**:

```typescript
describe("Feature Name", () => {
  it("should do something when condition is met", () => {
    // ✅ Arrange - Set up test data and mocks
    const input = { name: "Test" };

    // ✅ Act - Execute the code being tested
    const result = functionUnderTest(input);

    // ✅ Assert - Verify the result
    expect(result).toBe("expected value");
  });
});
```

---

## ✨ Testing Tips

### Do's ✅
- Start with services (no UI, easier)
- Use `npm run test:watch` during development
- Write descriptive test names
- Test user behavior, not implementation
- Use `data-testid` in components for E2E tests
- Mock external dependencies (Supabase, APIs)

### Don'ts ❌
- Don't test implementation details
- Don't use hardcoded timeouts in tests
- Don't skip coverage checks
- Don't test third-party libraries
- Don't make tests depend on each other
- Don't commit code with `.only()` or `.skip()`

---

## 🎓 Learning Resources

- [Vitest Docs](https://vitest.dev) - Test framework
- [Testing Library Docs](https://testing-library.com) - Component testing
- [Playwright Docs](https://playwright.dev) - E2E testing
- [TESTING.md](./TESTING.md) - This project's testing guide

---

## 🚨 Troubleshooting

### Tests won't run
```bash
# Verify Vitest is installed
npm run test -- --version
# Should show: vitest/4.0.13
```

### Import errors in tests
```bash
# Check tsconfig.vitest.json has correct paths
# Verify path aliases match tsconfig.json
```

### E2E tests fail to start dev server
```bash
# The dev server should auto-start
# Or manually start: npm run dev in another terminal
```

### Coverage looks low
```bash
# Check excluded files in vitest.config.ts
# Add tests for uncovered code paths
```

---

## Next: Implementation

You're ready! Here's the suggested order:

1. **Week 1**: Service tests (activity.service, etc.)
2. **Week 2**: Component tests (forms, displays)
3. **Week 3**: E2E tests (critical user flows)
4. **Ongoing**: Maintain 80%+ coverage

---

## Files to Reference

When writing tests, keep these handy:

- **For patterns**: [TESTING.md](./TESTING.md)
- **For code examples**: [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)
- **For tracking progress**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- **For project context**: [CLAUDE.md](./CLAUDE.md#testing-strategy)

---

## Quick Help

**Question**: How do I start a test for [Component]?
**Answer**: Copy template from [TEST_TEMPLATES.md](./TEST_TEMPLATES.md), customize names, done!

**Question**: Why aren't my tests running?
**Answer**: Check `vitest.config.ts` - test files should end in `.test.ts` or `.test.tsx`

**Question**: How do I see test coverage?
**Answer**: Run `npm run test:coverage` and open `coverage/index.html`

---

**You're all set! Happy testing! 🎉**

Start with a simple service test, use the templates, and build from there.

Questions? See [TESTING.md](./TESTING.md) or [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)
