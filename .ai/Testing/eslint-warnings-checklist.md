# ESLint Warnings Checklist

**Generated:** 2025-12-05
**Total Warnings:** 103

## Status Legend
- ✅ **Fixed** - Warning has been resolved
- 🔧 **In Progress** - Currently being worked on
- ⏳ **Pending** - Not yet started
- 📝 **Intentional** - Marked as acceptable for development

---

## E2E Tests (8 warnings) 📝

### global.setup.ts
- [ ] 📝 **Lines 17-25** - `no-console` - Unexpected console statement (4 instances)
  - **Lines:** 17, 18, 23, 25
  - **File:** [e2e/global.setup.ts](../e2e/global.setup.ts)
  - **Note:** Console logs are appropriate for test setup/debugging

### global.teardown.ts
- [ ] 📝 **Lines 17-24** - `no-console` - Unexpected console statement (4 instances)
  - **Lines:** 17, 18, 22, 24
  - **File:** [e2e/global.teardown.ts](../e2e/global.teardown.ts)
  - **Note:** Console logs are appropriate for test teardown/debugging

---

## Scripts (4 warnings) ✅ FIXED

### create-test-profile.js
- [x] ✅ **Lines 18, 25, 33, 37** - `no-console` - Unexpected console statement (4 instances)
  - **Fix:** Disabled via Node.js config in ESLint
  - **File:** [scripts/create-test-profile.js](../scripts/create-test-profile.js)

---

## Components (9 warnings)

### ActivitiesPageContainer.tsx
- [ ] ⏳ **Line 116** - `no-console` - Unexpected console statement
  - **File:** [src/components/ActivitiesPageContainer.tsx:116](../src/components/ActivitiesPageContainer.tsx#L116)

- [ ] ⏳ **Line 149** - `no-console` - Unexpected console statement
  - **File:** [src/components/ActivitiesPageContainer.tsx:149](../src/components/ActivitiesPageContainer.tsx#L149)

- [ ] ⏳ **Line 201** - `no-console` - Unexpected console statement
  - **File:** [src/components/ActivitiesPageContainer.tsx:201](../src/components/ActivitiesPageContainer.tsx#L201)

### ActivityFormModal.tsx
- [ ] ⏳ **Line 56** - `no-console` - Unexpected console statement
  - **File:** [src/components/ActivityFormModal.tsx:56](../src/components/ActivityFormModal.tsx#L56)

### UserMenu.tsx
- [ ] ⏳ **Line 46** - `no-console` - Unexpected console statement
  - **File:** [src/components/UserMenu.tsx:46](../src/components/UserMenu.tsx#L46)

- [ ] ⏳ **Line 51** - `no-console` - Unexpected console statement
  - **File:** [src/components/UserMenu.tsx:51](../src/components/UserMenu.tsx#L51)

---

## Hooks (1 warning)

### useActivities.ts
- [ ] ⏳ **Line 55** - `no-console` - Unexpected console statement
  - **File:** [src/components/hooks/useActivities.ts:55](../src/components/hooks/useActivities.ts#L55)

---

## Library - Services (47 warnings)

### index.ts
- [ ] ⏳ **Lines 16-51** - `no-console` - Unexpected console statement (9 instances)
  - **Lines:** 16, 20, 25, 28, 32, 39, 40, 48, 51
  - **File:** [src/lib/services/index.ts](../src/lib/services/index.ts)

### openrouter.service.ts
- [ ] ⏳ **Lines 43-456** - `no-console` - Unexpected console statement (38 instances)
  - **Lines:** 43, 44, 45, 54, 57, 59, 72, 87, 95, 117, 144, 145, 146, 147, 167, 174, 179, 188, 388, 392, 396, 403, 405, 411, 414, 416, 417, 421, 427, 437, 445, 456
  - **File:** [src/lib/services/openrouter.service.ts](../src/lib/services/openrouter.service.ts)
  - **Note:** Extensive logging for AI service debugging - may be intentional

---

## Library - Utils (1 warning)

### activity.mapper.ts
- [ ] ⏳ **Line 58** - `no-console` - Unexpected console statement
  - **File:** [src/lib/mappers/activity.mapper.ts:58](../src/lib/mappers/activity.mapper.ts#L58)

---

## Pages - Astro (15 warnings)

### activities.astro
- [ ] ⏳ **Lines 40-96** - `no-console` - Unexpected console statement (15 instances)
  - **Lines:** 40, 54, 61, 64, 68, 72, 74, 76, 81, 85, 88, 91, 96
  - **File:** [src/pages/activities.astro](../src/pages/activities.astro)
  - **Note:** Server-side logging during development

---

## Pages - API (27 warnings)

### activities.ts
- [ ] ⏳ **Lines 24-206** - `no-console` - Unexpected console statement (7 instances)
  - **Lines:** 24, 82, 103, 119, 185, 189, 206
  - **File:** [src/pages/api/activities.ts](../src/pages/api/activities.ts)

### activities/[id].ts
- [ ] ⏳ **Lines 31-208** - `no-console` - Unexpected console statement (8 instances)
  - **Lines:** 31, 118, 122, 139, 155, 193, 197, 208
  - **File:** [src/pages/api/activities/[id].ts](../src/pages/api/activities/[id].ts)

### auth/login.ts
- [ ] ⏳ **Lines 31-80** - `no-console` - Unexpected console statement (10 instances)
  - **Lines:** 31, 36, 44, 46, 53, 60, 76, 80
  - **File:** [src/pages/api/auth/login.ts](../src/pages/api/auth/login.ts)

### auth/logout.ts
- [ ] ⏳ **Line 32** - `no-console` - Unexpected console statement
  - **File:** [src/pages/api/auth/logout.ts:32](../src/pages/api/auth/logout.ts#L32)

### auth/signup.ts
- [ ] ⏳ **Lines 87-94** - `no-console` - Unexpected console statement (2 instances)
  - **Lines:** 87, 94
  - **File:** [src/pages/api/auth/signup.ts](../src/pages/api/auth/signup.ts)

### motivation/generate.ts
- [ ] ⏳ **Lines 48-67** - `no-console` - Unexpected console statement (2 instances)
  - **Lines:** 48, 67
  - **File:** [src/pages/api/motivation/generate.ts](../src/pages/api/motivation/generate.ts)

---

## Summary by Category

| Category | Warning Count | Status |
|----------|---------------|--------|
| E2E Tests (console) | 8 | 📝 Intentional |
| Scripts (console) | 4 | ✅ Fixed |
| Components (console) | 6 | ⏳ Pending |
| Hooks (console) | 1 | ⏳ Pending |
| Services (console) | 47 | ⏳ Pending |
| Utils/Mappers (console) | 1 | ⏳ Pending |
| Pages - Astro (console) | 15 | ⏳ Pending |
| Pages - API (console) | 29 | ⏳ Pending |
| **TOTAL** | **103** | **4 fixed, 91 pending, 8 intentional** |

---

## Recommendations

### Option 1: Replace with Proper Logging (Recommended for Production)
Implement a proper logging utility instead of `console.log`:

```typescript
// src/lib/utils/logger.ts
export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
};
```

Then replace all `console.log` with `logger.debug`, etc.

### Option 2: Disable for Development Files
Add ESLint overrides for specific development contexts:

```javascript
// eslint.config.js
const devFilesConfig = tseslint.config({
  files: [
    "src/pages/**/*.astro",
    "src/pages/api/**/*.ts",
    "src/lib/services/**/*.ts",
  ],
  rules: {
    "no-console": "off", // Allow console in dev files
  },
});
```

### Option 3: Selectively Disable
Add `// eslint-disable-next-line no-console` above each console statement that serves a debugging purpose.

---

## Action Plan

### Immediate (Before Production)
1. ✅ **E2E/Test files** - Already handled by Node.js config
2. ⏳ **API endpoints** - Replace with structured logging utility
3. ⏳ **Services** - Replace with conditional debug logging
4. ⏳ **Error handling** - Keep `console.error` for critical issues

### Future Enhancement
1. Implement centralized logging service
2. Add log levels (DEBUG, INFO, WARN, ERROR)
3. Configure different logging for dev vs production
4. Consider external logging service for production (e.g., Sentry, LogRocket)

---

## Files by Console Statement Count

| File | Count | Priority |
|------|-------|----------|
| [openrouter.service.ts](../src/lib/services/openrouter.service.ts) | 38 | High |
| [activities.astro](../src/pages/activities.astro) | 15 | Medium |
| [auth/login.ts](../src/pages/api/auth/login.ts) | 10 | Medium |
| [services/index.ts](../src/lib/services/index.ts) | 9 | Medium |
| [activities/[id].ts](../src/pages/api/activities/[id].ts) | 8 | Medium |
| [activities.ts](../src/pages/api/activities.ts) | 7 | Medium |
| [UserMenu.tsx](../src/components/UserMenu.tsx) | 2 | Low |
| [ActivitiesPageContainer.tsx](../src/components/ActivitiesPageContainer.tsx) | 3 | Low |
| Others (1 each) | 11 | Low |

---

## Configuration Changes Made

### eslint.config.js
Added Node.js environment configuration that automatically disables `no-console` for scripts and E2E tests:

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

This fixed 4 warnings in scripts and will prevent warnings in E2E test files.

---

## Notes

- All console warnings are style/linting issues, not functional errors
- Console statements in development are often helpful for debugging
- Consider keeping `console.error()` and `console.warn()` even in production
- The high count in `openrouter.service.ts` suggests this file needs the most attention for proper logging implementation
- Test files (E2E, global setup/teardown) should keep console statements for debugging purposes
