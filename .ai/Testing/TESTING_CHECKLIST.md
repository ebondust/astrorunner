# Testing Setup Checklist

Use this checklist to verify the testing environment is properly configured and to track your testing implementation progress.

---

## ✅ Setup Verification

- [x] Vitest installed and configured
- [x] Playwright installed and configured
- [x] React Testing Library installed
- [x] Testing utilities installed (@testing-library/jest-dom, @testing-library/user-event, MSW)
- [x] Package.json scripts added
- [x] Configuration files created
- [x] Test directories created
- [x] .gitignore updated
- [x] Documentation created

**Verification Commands:**
```bash
npm run test -- --version      # Should show vitest/4.0.13
npx playwright --version        # Should show Version 1.56.1
npm run test:ui                # Should launch test explorer (optional)
```

---

## 📋 Before Writing Tests

- [ ] Read [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [ ] Review [TEST_TEMPLATES.md](./TEST_TEMPLATES.md) - Copy-paste examples
- [ ] Understand service layer (business logic)
- [ ] Understand component structure
- [ ] Review [CLAUDE.md](./CLAUDE.md#testing-strategy) - Testing patterns

---

## 🧪 Unit & Integration Tests - Service Layer

Target: `src/lib/services/`

### Activity Service
- [ ] Create `src/lib/services/__tests__/activity.service.test.ts`
- [ ] Test activity creation with valid input
- [ ] Test activity validation error handling
- [ ] Test database error handling
- [ ] Test activity filtering/querying
- [ ] Verify coverage ≥ 90%

### Other Services (as applicable)
- [ ] OpenRouter service tests
- [ ] Authentication service tests
- [ ] Utility service tests

---

## 🧪 Unit & Integration Tests - Mappers

Target: `src/lib/mappers/`

### Activity Mapper
- [ ] Create `src/lib/mappers/__tests__/activity.mapper.test.ts`
- [ ] Test entity → DTO mapping
- [ ] Test command → entity mapping
- [ ] Test field naming conversions (snake_case ↔ camelCase)
- [ ] Test optional field handling
- [ ] Verify coverage ≥ 85%

---

## 🧪 Unit & Integration Tests - Validators

Target: `src/lib/validators.ts`

### Zod Schema Tests
- [ ] Create `src/lib/__tests__/validators.test.ts`
- [ ] Test activity schema with valid input
- [ ] Test activity schema with invalid input
- [ ] Test date validation
- [ ] Test duration validation
- [ ] Test validation error messages
- [ ] Verify coverage ≥ 80%

---

## 🧪 Unit & Integration Tests - Components

Target: `src/components/`

### Form Components
- [ ] Create component tests in `src/components/__tests__/`
- [ ] Test ActivityFormModal
  - [ ] Renders with correct fields
  - [ ] Form submission with valid data
  - [ ] Validation error display
  - [ ] Cancel button functionality
- [ ] Other form components

### Display Components
- [ ] Test ActivityCard rendering
- [ ] Test ActivityList with data
- [ ] Test ActivityList empty state
- [ ] Test filtering UI interactions

### Hook Tests
- [ ] Create hook tests in `src/components/hooks/__tests__/`
- [ ] Test useActivities hook
- [ ] Test useMonthNavigation hook
- [ ] Mock Supabase client
- [ ] Test loading/error states

---

## 🧪 Unit & Integration Tests - API Routes

Target: `src/pages/api/`

### API Endpoint Tests
- [ ] Create `src/pages/api/__tests__/activities.test.ts`
- [ ] Test GET activities endpoint
  - [ ] Valid request returns activities
  - [ ] Invalid query params rejected
  - [ ] Authentication required
- [ ] Test POST activities endpoint
  - [ ] Valid activity created
  - [ ] Invalid data returns 422
  - [ ] Missing required fields
  - [ ] Database errors handled

---

## 📊 Coverage Report

- [ ] Run `npm run test:coverage`
- [ ] Review HTML report at `coverage/index.html`
- [ ] Identify untested code paths
- [ ] Add tests for critical gaps
- [ ] **Target: 80% line coverage minimum**

---

## 🎭 E2E Tests - Setup

- [ ] Review [playwright.config.ts](./playwright.config.ts)
- [ ] Understand Page Object Model pattern
- [ ] Review [TEST_TEMPLATES.md](./TEST_TEMPLATES.md#page-objects)
- [ ] Add `data-testid` attributes to components:
  - [ ] Form inputs
  - [ ] Buttons
  - [ ] Activity cards
  - [ ] Navigation elements

---

## 🎭 E2E Tests - Page Objects

Target: `e2e/page-objects/`

### Base Page Object
- [ ] Create `e2e/page-objects/BasePage.ts`
- [ ] Basic navigation methods
- [ ] Common element locators
- [ ] Wait utilities

### Page Objects by Feature
- [ ] Create `LoginPage.ts` (authentication flow)
- [ ] Create `ActivityPage.ts` (activity list/creation)
- [ ] Create `ProfilePage.ts` (user settings)

---

## 🎭 E2E Tests - Critical Flows

Target: `e2e/`

### Authentication
- [ ] Create `e2e/auth.spec.ts`
- [ ] User can log in
- [ ] User can log out
- [ ] Invalid credentials show error
- [ ] Login form validation

### Activity Management
- [ ] Create `e2e/activities.spec.ts`
- [ ] User can view activity list
- [ ] User can create activity
- [ ] User can view activity details
- [ ] User can filter/search activities
- [ ] User can delete activity

### Navigation
- [ ] Create `e2e/navigation.spec.ts`
- [ ] Navigation between pages
- [ ] Active nav highlighting
- [ ] Mobile menu (if applicable)

---

## 🏃 Running Tests

### Before Committing
- [ ] Run `npm run lint:fix` - Fix linting issues
- [ ] Run `npm run format` - Format code
- [ ] Run `npm run test` - Unit/integration tests pass
- [ ] Run `npm run test:coverage` - Coverage above 80%
- [ ] Run `npm run e2e` - E2E tests pass

### Debugging Tests
- [ ] Use `npm run test:watch` for development
- [ ] Use `npm run test:ui` for visual exploration
- [ ] Use `npm run e2e:debug` for E2E debugging
- [ ] Use `npm run e2e:headed` to see browser

---

## 📝 Test Documentation

For each test suite, document:
- [ ] What the test covers
- [ ] Setup required (mocks, fixtures)
- [ ] Key assertions
- [ ] Any special configuration

---

## 🔍 Code Review Checklist

Before submitting tests:
- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Descriptive test names (`should...`, `it('...')`)
- [ ] No implementation detail testing
- [ ] Proper mock usage
- [ ] No hardcoded timeouts
- [ ] Coverage thresholds met
- [ ] All tests pass locally
- [ ] No console.log or .only() in code

---

## 📈 Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| Services | 90% | [ ] |
| Mappers | 85% | [ ] |
| Validators | 80% | [ ] |
| Components | 75% | [ ] |
| API Routes | 80% | [ ] |
| **Overall** | **80%** | [ ] |

---

## 🚀 Going Further

Once basic tests are in place:

- [ ] Add snapshot tests for complex components
- [ ] Implement visual regression testing
- [ ] Add performance tests
- [ ] Set up CI/CD pipeline with tests
- [ ] Configure code coverage reporting
- [ ] Document test patterns in team wiki

---

## 📚 Useful Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about#priority)
- [TESTING.md](./TESTING.md) - Project testing guide
- [TEST_TEMPLATES.md](./TEST_TEMPLATES.md) - Code templates

---

## Notes

- Start with services (no UI, easier to test)
- Move to components (UI, requires mocking)
- End with E2E (full user flows)
- Keep tests focused and isolated
- Test behavior, not implementation
- Mock external dependencies

---

**Last Updated**: 2025-11-23
**Setup Status**: ✅ Complete and ready for test implementation
