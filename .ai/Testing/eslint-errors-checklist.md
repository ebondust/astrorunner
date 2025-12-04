# ESLint Errors Checklist

**Generated:** 2025-12-05
**Total Errors:** 104

## Status Legend
- ✅ **Fixed** - Error has been resolved
- 🔧 **In Progress** - Currently being worked on
- ⏳ **Pending** - Not yet started

---

## E2E Tests (3 errors) ✅ ALL FIXED

### auth-fixture.ts
- [x] ✅ **Line 51** - `react-hooks/rules-of-hooks` - React Hook "use" called in non-React function
  - **Fix:** Added ESLint disable comment (Playwright fixture API, not React)
  - **File:** [e2e/fixtures/auth-fixture.ts:51](../e2e/fixtures/auth-fixture.ts#L51)

### test-data.ts
- [x] ✅ **Line 152** - `@typescript-eslint/no-explicit-any` - Unexpected any
  - **Fix:** Replaced with `"Run" | "Walk" | "Mixed" | ""`
  - **File:** [e2e/fixtures/test-data.ts:152](../e2e/fixtures/test-data.ts#L152)

### database.ts
- [x] ✅ **Lines 12-14** - `@typescript-eslint/no-non-null-assertion` - Forbidden non-null assertion (3 instances)
  - **Fix:** Replaced `!` with nullish coalescing `??`
  - **File:** [e2e/helpers/database.ts:12-14](../e2e/helpers/database.ts#L12-L14)

---

## Scripts (13 errors) ✅ ALL FIXED

### create-test-profile.js
- [x] ✅ **Lines 13-37** - `no-undef` - process/console not defined (10 instances)
  - **Fix:** Added Node.js globals config to ESLint
  - **File:** [scripts/create-test-profile.js](../scripts/create-test-profile.js)

### dev-e2e.js
- [x] ✅ **Lines 17-26** - `no-undef` - process/console not defined (4 instances)
  - **Fix:** Added Node.js globals config to ESLint
  - **File:** [scripts/dev-e2e.js](../scripts/dev-e2e.js)

---

## Components (14 errors)

### ActivitiesPageContainer.tsx ✅
- [x] ✅ **Lines 42-43** - `@typescript-eslint/no-unused-vars` - Unused variables (2 instances)
  - **Variables:** `goToPreviousMonth`, `goToNextMonth`
  - **Fix:** Removed from destructuring
  - **File:** [src/components/ActivitiesPageContainer.tsx:42-43](../src/components/ActivitiesPageContainer.tsx#L42-L43)

- [ ] ⏳ **Line 116** - `no-console` - Unexpected console statement
- [ ] ⏳ **Line 149** - `no-console` - Unexpected console statement
- [ ] ⏳ **Line 201** - `no-console` - Unexpected console statement

### ActivityFormModal.test.tsx ✅
- [x] ✅ **Line 12** - `@typescript-eslint/no-unused-vars` - Unused parameter
  - **Fix:** Removed unused parameter from mock function
  - **File:** [src/components/ActivityFormModal.test.tsx:12](../src/components/ActivityFormModal.test.tsx#L12)

- [x] ✅ **Lines 18-20** - `@typescript-eslint/no-empty-function` - Empty methods (3 instances)
  - **Fix:** Added comments to mock implementations
  - **File:** [src/components/ActivityFormModal.test.tsx:18-20](../src/components/ActivityFormModal.test.tsx#L18-L20)

- [x] ✅ **Lines 29, 36** - `@typescript-eslint/no-explicit-any` - Unexpected any (2 instances)
  - **Fix:** Added proper types and ESLint disable comment
  - **File:** [src/components/ActivityFormModal.test.tsx](../src/components/ActivityFormModal.test.tsx)

### ActivityFormModal.tsx ✅
- [ ] ⏳ **Line 56** - `no-console` - Unexpected console statement

- [x] ✅ **Line 121** - `@typescript-eslint/no-explicit-any` - Unexpected any
  - **Fix:** Replaced with `"Run" | "Walk" | "Mixed"`
  - **File:** [src/components/ActivityFormModal.tsx:121](../src/components/ActivityFormModal.tsx#L121)

### LoginForm.tsx ✅
- [x] ✅ **Line 145** - `react/no-unescaped-entities` - Unescaped apostrophe
  - **Fix:** Replaced `'` with `&apos;`
  - **File:** [src/components/LoginForm.tsx:145](../src/components/LoginForm.tsx#L145)

### ResetPasswordForm.tsx ✅
- [x] ✅ **Line 123** - `react/no-unescaped-entities` - Unescaped apostrophe
  - **Fix:** Replaced `'` with `&apos;`
  - **File:** [src/components/ResetPasswordForm.tsx:123](../src/components/ResetPasswordForm.tsx#L123)

### UserMenu.tsx
- [ ] ⏳ **Line 46** - `no-console` - Unexpected console statement
- [ ] ⏳ **Line 51** - `no-console` - Unexpected console statement

---

## Hooks (4 errors)

### useActivities.test.ts
- [ ] ⏳ **Line 280** - `@typescript-eslint/no-non-null-assertion` - Forbidden non-null assertion
  - **File:** [src/components/hooks/useActivities.test.ts:280](../src/components/hooks/useActivities.test.ts#L280)

- [ ] ⏳ **Line 55** - `no-console` - Unexpected console statement

### useActivityForm.ts
- [ ] ⏳ **Line 2** - `@typescript-eslint/no-unused-vars` - Unused import `ActivityType`
  - **File:** [src/components/hooks/useActivityForm.ts:2](../src/components/hooks/useActivityForm.ts#L2)

- [ ] ⏳ **Line 41** - `@typescript-eslint/no-dynamic-delete` - No dynamic delete
  - **File:** [src/components/hooks/useActivityForm.ts:41](../src/components/hooks/useActivityForm.ts#L41)

---

## Database (1 error)

### database.types.ts
- [ ] ⏳ **Line 1** - Parsing error - File appears to be binary
  - **File:** [src/db/database.types.ts:1](../src/db/database.types.ts#L1)
  - **Note:** This may be a false positive or encoding issue

---

## Layouts (1 error)

### AuthenticatedLayout.astro
- [ ] ⏳ **Line 10** - `@typescript-eslint/no-unused-vars` - Unused variable `user`
  - **File:** [src/layouts/AuthenticatedLayout.astro:10](../src/layouts/AuthenticatedLayout.astro#L10)

---

## Library - Services (40 errors)

### activity.service.test.ts
- [ ] ⏳ **Lines 52-560** - `@typescript-eslint/no-explicit-any` - Unexpected any (12 instances)
  - **Lines:** 52, 102, 151, 193, 259, 290, 326, 369, 418, 468, 510, 560
  - **File:** [src/lib/services/activity.service.test.ts](../src/lib/services/activity.service.test.ts)

### openrouter.service.test.ts
- [ ] ⏳ **Line 3** - `@typescript-eslint/no-unused-vars` - Unused import `OpenRouterTimeoutError`
- [ ] ⏳ **Line 4** - `@typescript-eslint/no-unused-vars` - Unused import `MotivationalMessage`

- [ ] ⏳ **Lines 114-661** - `@typescript-eslint/no-explicit-any` - Unexpected any (27 instances)
  - **Lines:** 114, 136, 158, 178, 188, 196, 206, 228, 261, 279, 299, 321, 428, 457, 474, 489, 503, 531, 557, 565, 588, 630, 645, 661, 704
  - **File:** [src/lib/services/openrouter.service.test.ts](../src/lib/services/openrouter.service.test.ts)

### openrouter.service.ts
- [ ] ⏳ **Lines 194-398** - `@typescript-eslint/no-explicit-any` - Unexpected any (3 instances)
  - **Lines:** 194, 200, 398
  - **File:** [src/lib/services/openrouter.service.ts](../src/lib/services/openrouter.service.ts)

### openrouter.types.ts
- [ ] ⏳ **Line 27** - `@typescript-eslint/no-explicit-any` - Unexpected any
  - **File:** [src/lib/services/openrouter.types.ts:27](../src/lib/services/openrouter.types.ts#L27)

---

## Library - Utils (26 errors)

### activity-stats.test.ts
- [ ] ⏳ **Lines 63-558** - `@typescript-eslint/no-explicit-any` - Unexpected any (20 instances)
  - **Lines:** 63, 92, 115, 157, 188, 217, 246, 275, 293, 310, 331, 352, 371, 402, 432, 461, 498, 529, 552, 558
  - **File:** [src/lib/utils/activity-stats.test.ts](../src/lib/utils/activity-stats.test.ts)

### activity-stats.ts
- [ ] ⏳ **Line 3** - `@typescript-eslint/no-unused-vars` - Unused import `ActivityEntity`
  - **File:** [src/lib/utils/activity-stats.ts:3](../src/lib/utils/activity-stats.ts#L3)

### date.ts
- [ ] ⏳ **Line 129** - `@typescript-eslint/no-non-null-assertion` - Forbidden non-null assertion
  - **File:** [src/lib/utils/date.ts:129](../src/lib/utils/date.ts#L129)

### validation.test.ts
- [ ] ⏳ **Lines 628-683** - `@typescript-eslint/no-explicit-any` - Unexpected any (3 instances)
  - **Lines:** 628, 664, 683
  - **File:** [src/lib/utils/validation.test.ts](../src/lib/utils/validation.test.ts)

### validators.ts
- [ ] ⏳ **Line 3** - `@typescript-eslint/no-unused-vars` - Unused import `ActivityType`
  - **File:** [src/lib/validators.ts:3](../src/lib/validators.ts#L3)

---

## Pages - API (2 errors)

### logout.ts
- [ ] ⏳ **Line 4** - `@typescript-eslint/no-unused-vars` - Unused import `internalServerError`
  - **File:** [src/pages/api/auth/logout.ts:4](../src/pages/api/auth/logout.ts#L4)

### mappers/activity.mapper.ts
- [ ] ⏳ **Line 58** - `no-console` - Unexpected console statement

---

## Summary by Error Type

| Error Type | Count | Fixed | Remaining |
|------------|-------|-------|-----------|
| `@typescript-eslint/no-explicit-any` | 68 | 3 | 65 |
| `no-console` | 7 | 0 | 7 |
| `no-undef` | 14 | 14 | 0 |
| `@typescript-eslint/no-unused-vars` | 7 | 2 | 5 |
| `@typescript-eslint/no-non-null-assertion` | 4 | 3 | 1 |
| `react/no-unescaped-entities` | 2 | 2 | 0 |
| `react-hooks/rules-of-hooks` | 1 | 1 | 0 |
| `@typescript-eslint/no-empty-function` | 3 | 3 | 0 |
| `@typescript-eslint/no-dynamic-delete` | 1 | 0 | 1 |
| Parsing error | 1 | 0 | 1 |
| **TOTAL** | **104** | **28** | **76** |

---

## Priority Recommendations

### High Priority (Breaking/Security)
1. ⚠️ Fix `database.types.ts` parsing error - May break type checking
2. ⚠️ Fix `no-dynamic-delete` in `useActivityForm.ts` - Potential runtime issues

### Medium Priority (Code Quality)
1. Replace all `@typescript-eslint/no-explicit-any` with proper types (65 instances)
2. Fix non-null assertions (2 remaining)
3. Remove unused imports (5 instances)

### Low Priority (Style/Warnings)
1. Remove or disable `no-console` warnings for development code (7 instances)

---

## Configuration Changes Made

### eslint.config.js
Added Node.js environment configuration for scripts and E2E tests:

```javascript
const nodeScriptsConfig = tseslint.config({
  files: ["scripts/**/*.js", "e2e/**/*.ts"],
  languageOptions: {
    globals: {
      process: true,
      console: true,
      __dirname: true,
      __filename: true,
    },
  },
  rules: {
    "no-console": "off",
  },
});
```

This fixed 14 `no-undef` errors in scripts and disabled console warnings for E2E tests.

---

## Notes

- **Test files** with `@typescript-eslint/no-explicit-any` may be acceptable - mocking often requires `any`
- **Console statements** in development/debugging code may be intentional
- **Database types file** parsing error needs investigation - may be encoding issue
- Consider creating a `.eslintrc` override for test files to allow `any` in specific contexts
