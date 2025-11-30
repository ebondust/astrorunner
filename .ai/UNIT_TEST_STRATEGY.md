# Unit Test Strategy - AstroRunner

This document outlines which elements of the AstroRunner project should be tested with unit tests and why.

## High Priority for Unit Testing

### 1. **Utility Functions** (`lib/utils/`)

**Why:** Pure functions with predictable inputs/outputs, critical business logic

#### `lib/utils/date.ts`
- Functions like `formatDuration`, `formatDistance`, `formatActivityDate`
- Date calculations: `getMonthRange`, `toISODate`, `getCurrentMonthStart`
- **Reason:** Date manipulation is error-prone; edge cases (leap years, timezone boundaries, month transitions) need verification

#### `lib/utils/validation.ts`
- `validateActivityForm`, `hasFormErrors`
- **Reason:** Validation logic is critical for data integrity and user experience

#### `lib/utils/activity-stats.ts`
- Statistical calculations
- **Reason:** Math-heavy functions need verification for accuracy

### 2. **Mappers** (`lib/mappers/`)

**Why:** Data transformation layer between database and API

#### `lib/mappers/activity.mapper.ts`
- `mapEntityToDto` - Entity → DTO transformation
- `mapCommandToEntity` - Command → Entity transformation
- **Reason:** Data integrity; ensures proper field mapping, type conversion (snake_case ↔ camelCase), null handling

### 3. **Validators** (`lib/validators.ts`)

**Why:** Input validation is a security and data quality boundary

- Zod schemas testing with:
  - Valid inputs (happy path)
  - Invalid inputs (boundary cases)
  - Edge cases (null, undefined, empty strings, extreme values)
- Helper functions like `validateIsoDate`, `parseDuration`
- **Reason:** Prevents invalid data from entering the system; complex validation rules need verification

### 4. **Services** (`lib/services/`)

**Why:** Core business logic layer

#### `lib/services/activity.service.ts`
- CRUD operations (mock Supabase client)
- Data transformation logic
- Error handling paths
- **Reason:** Business rules enforcement; database interaction logic without actual DB calls

#### `lib/services/openrouter.service.ts`
- API integration logic (mock HTTP calls)
- Fallback logic
- Error handling
- **Reason:** External API integration; verify fallback behavior, error recovery

## Medium Priority for Unit Testing

### 5. **Custom Hooks** (`components/hooks/`)

**Why:** State management and data fetching logic

#### `hooks/useActivities`
- CRUD operations
- State updates
- Error handling
- **Reason:** Complex state management; ensure data consistency

#### `hooks/useActivityForm`
- Form state management
- Validation integration
- **Reason:** Form logic can be complex; validation feedback needs verification

#### `hooks/useMonthNavigation`
- Date navigation logic
- **Reason:** Boundary cases (year transitions, min/max dates)

### 6. **API Client Functions** (`lib/api/`)

**Why:** Client-side API interaction layer

#### `lib/api/activities.client.ts`
- HTTP request construction
- Response parsing
- Error handling
- **Reason:** Ensures correct API contract; mock fetch to test without backend

## Lower Priority (but still valuable)

### 7. **UI Components** (`components/`)

**Why:** User interaction testing (consider React Testing Library)

Focus on components with complex logic:
- `ActivityFormModal` - Form validation, submission logic
- `ActivityList` - Data rendering, empty states, loading states
- `ActivityCard` - Data display, action handlers

**Reason:** Verify user interactions, accessibility, conditional rendering

### 8. **Error Helpers** (`lib/api/errors.ts`)

**Why:** Consistent error responses

- `badRequest`, `unprocessableEntity`, `internalServerError`
- **Reason:** Ensure proper status codes, error format consistency

## Testing Strategy Summary

```
Priority 1 (Must Have):
├── lib/utils/date.ts           ⭐⭐⭐ Complex calculations, edge cases
├── lib/utils/validation.ts     ⭐⭐⭐ Security boundary
├── lib/mappers/                ⭐⭐⭐ Data integrity
└── lib/validators.ts           ⭐⭐⭐ Input validation

Priority 2 (Should Have):
├── lib/services/               ⭐⭐ Business logic
├── hooks/                      ⭐⭐ State management
└── lib/api/activities.client   ⭐⭐ API contract

Priority 3 (Nice to Have):
├── components/ (complex ones)  ⭐ User experience
└── lib/api/errors.ts          ⭐ Consistency
```

## Why These Priorities?

1. **Pure functions first**: Utils, mappers, validators are easiest to test and have highest ROI
2. **Business logic second**: Services contain critical rules but require mocking
3. **UI components last**: More complex to test, but React Testing Library makes it feasible
4. **Focus on edge cases**: Date boundaries, validation limits, null handling, error paths
5. **Mock external dependencies**: Supabase client, fetch API, external services

## Testing Approach

### For Pure Functions (Utils, Mappers, Validators)
- Test with various inputs
- Verify edge cases
- Check error handling
- No mocking required
- **IMPORTANT**: Always verify actual function behavior before writing assertions:
  - `toISOString()` adds `.000` for milliseconds even if input lacks them
  - `parseDuration()` normalizes time (e.g., 90 minutes → "1 hour 30 minutes", not "90 minutes")

### For Services
- Mock Supabase client
- Test business logic paths
- Verify error scenarios
- Test data transformations
- **Timeout Testing**: Simulate timeouts by mocking fetch to reject with `AbortError` (name: "AbortError"), not with never-resolving promises
- **Retry Testing**: Use `vi.runAllTimersAsync()` to advance all timers at once instead of multiple `advanceTimersByTimeAsync()` calls
- **Dynamic Content**: Verify structure/types rather than exact message content when testing AI-generated or variable responses

### For Hooks
- Use React Testing Library hooks testing utilities
- Mock API calls
- Test state updates
- Verify side effects

### For Components
- Use React Testing Library
- Test user interactions
- Verify accessibility
- Test conditional rendering

## Testing Tools

- **Vitest**: Main test runner
- **@testing-library/react**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM matchers
- **MSW (Mock Service Worker)**: API mocking
- **happy-dom/jsdom**: DOM environment

---

**Last Updated**: 2025-11-24
**Status**: Planning Document
