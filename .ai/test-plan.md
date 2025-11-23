# Test Plan - AstroRunner (Activity Logger)

**Document Version:** 2.0
**Last Updated:** 2025-11-23
**Project Status:** MVP Development (v0.0.1)
**Maintained By:** Development Team

---

## 1. Introduction & Objectives

**AstroRunner** is a minimalist web application for tracking and viewing personal run and walk activities. This test plan outlines the testing strategy for the MVP phase.

### Testing Objectives

- **Verify MVP functionality** works according to requirements
- **Ensure security** through authentication, authorization, and data protection
- **Protect user data** via RLS policies and input validation
- **Maintain performance** with response times < 200ms for CRUD operations
- **Ensure accessibility** compliance with WCAG 2.1 AA standards

### Out of Scope for MVP

- Calendar view, statistics pages, and advanced analytics (Phase 2)
- Load testing with k6 or JMeter (Lighthouse performance testing sufficient)
- Cross-browser matrix testing (manual testing on 2-3 browsers only)
- Automated security scanning (OWASP ZAP) - use focused security tests instead

---

## 2. Test Scope

### Modules Under Testing

| Module | Components | Priority |
|--------|-----------|----------|
| **Authentication** | `/api/auth/*`, middleware, session management | Critical |
| **Activities (CRUD)** | `/api/activities/*`, services, validation | Critical |
| **Motivation** | `/api/motivation/*`, OpenRouter integration, caching | High |
| **React Components** | Forms, modals, lists, navigation, hooks | High |
| **Validation & Utils** | Zod schemas, date/duration parsing, mappers | High |
| **Database** | RLS policies, table schemas, indexes | Critical |

### Modules Excluded

- CI/CD configuration (GitHub Actions)
- Docker and DigitalOcean configuration
- Deployment-specific infrastructure

---

## 3. Types of Tests to Be Performed

### 3.1 Unit Tests

**Objective:** Verify individual functions, components, and modules in isolation.

**Scope:**
- Validation functions (`validateIsoDate()`, `parseDuration()`, `validateDistance()`)
- Zod schemas for all commands (signup, login, activity creation, etc.)
- Helper functions (date handling, statistics, utilities)
- Mappers (DTO ↔ Entity transformations)
- Services (activity, OpenRouter integration logic)
- React components (rendering, state, interactions)
- React hooks (`useActivities`, `useActivityForm`, `useMonthNavigation`)

**Tools:** Vitest, React Testing Library, @testing-library/user-event, @testing-library/jest-dom

**Target:** 80% code coverage minimum (90% for critical modules: auth, validation, services)

---

### 3.2 Integration Tests

**Objective:** Verify cooperation between modules and components.

**Scope:**
- API endpoints + services integration
- Middleware + protected endpoints
- React components + API client integration
- Supabase CRUD operations with RLS policies
- OpenRouter API integration with error handling and caching

**Tools:** Vitest, MSW (Mock Service Worker), Supabase Test Client

---

### 3.3 End-to-End (E2E) Tests

**Objective:** Verify complete user flows from start to finish.

**Critical Flows:**
1. User registration and first login
2. Activity creation and display (optimistic updates)
3. Activity edit and update
4. Activity deletion with confirmation
5. Month-based filtering
6. Logout and protected route access

**Tools:** Playwright (primary)

---

### 3.4 Security Tests

**Objective:** Verify authentication, authorization, and data protection.

**Scope:**
- Authentication: Protected routes without auth should redirect
- Authorization: Users cannot access/modify other users' data (RLS)
- Input validation: SQL injection, XSS, oversized payloads blocked
- Session management: HTTPOnly cookies, secure storage

**Tools:** Vitest test files, custom security test scenarios

**Out of Scope:** OWASP ZAP scanning (write focused tests instead)

---

### 3.5 Performance Tests

**Objective:** Ensure acceptable response times and frontend performance.

**Metrics:**
- API CRUD operations: < 200ms
- Activity list retrieval (100 items): < 500ms
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Performance Score: > 90

**Tools:** Lighthouse (via Chrome DevTools or CI), browser DevTools

**Out of Scope:** Load testing with k6 or JMeter (MVP only needs baseline metrics)

---

### 3.6 Accessibility Tests

**Objective:** Ensure WCAG 2.1 AA compliance.

**Scope:**
- Keyboard navigation and focus management
- ARIA labels and roles
- Color contrast (WCAG AA: 4.5:1 for text)
- Form labels and error messages
- Screen reader compatibility (manual testing)

**Tools:** axe DevTools, Lighthouse accessibility audit, manual testing

**Target:** Lighthouse Accessibility Score > 90, zero WCAG AA violations

---

### 3.7 Responsive Design Tests

**Objective:** Verify application works on different screen sizes.

**Devices:**
- Mobile: 320px - 768px (iPhone SE, Android phones)
- Tablet: 768px - 1024px (iPad, landscape)
- Desktop: 1024px+ (laptops, monitors)

**Tools:** Browser DevTools, manual testing in responsive mode

---

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication

| Scenario | Steps | Expected | Priority |
|----------|-------|----------|----------|
| **TC-AUTH-001: Signup - Success** | Navigate to `/auth/register` → Enter valid email & password (min. 8 chars, 1 uppercase, 1 number) → Click "Sign up" | Account created, auto-logged in, redirect to `/activities`, empty state shown | Critical |
| **TC-AUTH-002: Signup - Invalid Email** | Enter invalid email format (e.g., `invalid-email`) | Validation error displayed, account not created | High |
| **TC-AUTH-003: Signup - Weak Password** | Enter password < 8 chars or missing uppercase/number | Validation error displayed, account not created | High |
| **TC-AUTH-004: Login - Valid Credentials** | Navigate to `/auth/login` → Enter valid email & password → Click "Log in" | User logged in, HTTPOnly cookie set, redirect to `/activities` | Critical |
| **TC-AUTH-005: Login - Invalid Credentials** | Enter wrong email or password | 401 error, generic message "Invalid credentials", no account enumeration | High |
| **TC-AUTH-006: Logout** | Click user menu → Click "Logout" | Session terminated, redirect to `/auth/login`, `/activities` requires re-login | High |
| **TC-AUTH-007: Protected Route** | Logout and try to access `/activities` directly | Middleware redirects to `/auth/login` | Critical |

---

### 4.2 Activity Management

| Scenario | Steps | Expected | Priority |
|----------|-------|----------|----------|
| **TC-ACT-001: Create - All Fields** | Navigate to `/activities` → Click "Add activity" → Fill date, duration (PT45M or 00:45:00), type (Run), distance (5000m) → Save | Optimistic update shows immediately, server confirms, activity displayed in list | Critical |
| **TC-ACT-002: Create - Required Fields Only** | Fill only date, duration, type → Save | Activity created without distance, list shows without distance info | High |
| **TC-ACT-003: Create - Invalid Date** | Enter date format `2025-13-45` | Validation error: "Invalid ISO-8601 date", activity not created | High |
| **TC-ACT-004: Create - Zero Duration** | Enter duration `PT0S` or `00:00:00` | Validation error: "Duration must be > 0", activity not created | High |
| **TC-ACT-005: Create - Negative Distance** | Enter distance `-1000` | Validation error: "Distance must be ≥ 0", activity not created | Medium |
| **TC-ACT-006: Edit Activity** | Click edit → Modify data (e.g., type Run → Walk) → Save | Optimistic update shows immediately, server confirms, list updated | Critical |
| **TC-ACT-007: Delete - With Confirmation** | Click delete → Click "Delete" in modal | Optimistic update removes from list, server confirms, activity gone | Critical |
| **TC-ACT-008: Delete - Cancel** | Click delete → Click "Cancel" | Modal closes, activity remains in list, not deleted from DB | Medium |
| **TC-ACT-009: Filter by Month** | Click month navigation → Select different month | Only activities from selected month displayed, sorted by date (newest first) | High |
| **TC-ACT-010: Empty State** | View month with no activities | EmptyState component shown, "Add activity" button available | Medium |

---

### 4.3 Security

| Scenario | Steps | Expected | Priority |
|----------|-------|----------|----------|
| **TC-SEC-001: RLS - Read Other User's Activity** | User A creates activity → User B tries to access User A's activity via API | RLS policy blocks access, returns 404 or empty result | Critical |
| **TC-SEC-002: RLS - Modify Other User's Activity** | User A creates activity → User B tries to PUT/DELETE User A's activity | RLS policy blocks modification, activity unchanged | Critical |
| **TC-SEC-003: SQL Injection** | In activity form, enter `'; DROP TABLE activities; --` | Payload treated as plain string, Zod validation rejects or escapes, DB secure | High |
| **TC-SEC-004: XSS Prevention** | In form field, enter `<script>alert('XSS')</script>` | Script not executed, data escaped during render (React default) | High |
| **TC-SEC-005: Optimistic Update Rollback** | Create activity, disconnect network before server response | Optimistic update reverted, error shown, user can retry | High |

---

### 4.4 OpenRouter Integration (Motivation)

| Scenario | Steps | Expected | Priority |
|----------|-------|----------|----------|
| **TC-MOT-001: Generate Message** | Navigate to `/activities` with existing activities | Motivational message appears in banner, personalized, cached | Medium |
| **TC-MOT-002: API Error Handling** | Simulate OpenRouter API error | Fallback message shown or banner hidden, error logged, app still functional | Medium |
| **TC-MOT-003: Caching** | Load `/activities`, refresh page | Same message shown (no new API call if stats unchanged), cache expires in 15min | Low |

---

## 5. Test Environment

### Local Development
- **Node.js:** 22.14.0
- **Supabase:** Local instance (Supabase CLI)
- **Port:** `http://localhost:3000`
- **Purpose:** Unit tests, integration tests, developer testing

### Staging
- **Supabase:** Separate staging project
- **Hosting:** DigitalOcean (staging environment)
- **URL:** `https://staging.astrorunner.app`
- **Purpose:** E2E tests, performance testing, pre-release validation

### Production
- **Supabase:** Production instance
- **Hosting:** DigitalOcean
- **URL:** `https://astrorunner.app`
- **Purpose:** Smoke tests, production monitoring

### Test Data
- **test-user-1@example.com** - activities in multiple months
- **test-user-2@example.com** - no activities
- **test-user-3@example.com** - large activity count (performance testing)

---

## 6. Testing Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Unit & Integration** | **Vitest** | Fast, ESM-native test framework with TypeScript support |
| | **React Testing Library** | Component testing from user perspective |
| | **@testing-library/user-event** | Realistic user interactions in tests |
| | **@testing-library/jest-dom** | DOM matchers for assertions |
| | **MSW** | Mock Service Worker for API mocking |
| **E2E** | **Playwright** | Multi-browser E2E testing with screenshots/videos |
| **Performance** | **Lighthouse** | Performance, accessibility, SEO audits |
| | **Chrome DevTools** | Performance profiling, debugging |
| **Accessibility** | **axe DevTools** | Automated WCAG compliance checking |
| **Version Control** | **GitHub Issues** | Bug tracking and test result logging |

---

## 7. Test Schedule

### Phase 1: Unit Tests (Week 1-2)
- Write tests for validators, mappers, services, hooks
- Target: 80% coverage for general code, 90% for critical modules
- CI: GitHub Actions runs on every PR

### Phase 2: Integration Tests (Week 2-3)
- Test API endpoints with services and database
- Test React components with API integration
- Test Supabase RLS policies with actual tables

### Phase 3: E2E Tests (Week 3-4)
- Write Playwright tests for 6 critical user flows
- Run on staging environment
- Setup parallel execution for faster feedback

### Phase 4: Security & Performance (Week 4-5)
- Write focused security tests (RLS, input validation, XSS)
- Run Lighthouse audits
- Manual accessibility testing with axe DevTools

### Phase 5: Regression & Release (Week 6+)
- Full test suite runs before each release
- Smoke tests on staging and production
- Manual testing of critical flows

### Continuous Integration
- **Trigger:** Push to branch, Pull Request to master
- **Steps:**
  1. Install dependencies
  2. Lint check (ESLint)
  3. Type check (TypeScript)
  4. Unit & integration tests (Vitest)
  5. Build check
  6. E2E tests (staging/main only)

### Pre-commit Hooks
- **Tool:** Husky + lint-staged
- Format code (Prettier), lint (ESLint), type check, run unit tests on changed files

---

## 8. Test Acceptance Criteria

### Code Quality
- ✅ Minimum 80% code coverage (unit + integration tests)
- ✅ Critical modules: 90% coverage (auth, validation, services)
- ✅ React components: 70% coverage
- ✅ Zero failing automated tests before merge to master

### Performance
- ✅ API CRUD operations: < 200ms
- ✅ Activity list (100 items): < 500ms
- ✅ First Contentful Paint: < 1.5s
- ✅ Time to Interactive: < 3s
- ✅ Lighthouse Performance Score: > 90

### Security
- ✅ All security test scenarios pass
- ✅ RLS policies block unauthorized access
- ✅ Input validation prevents SQL injection and XSS
- ✅ No critical vulnerabilities from axe audits
- ✅ HTTPOnly cookies used for session storage

### Accessibility
- ✅ Lighthouse Accessibility Score: > 90
- ✅ Zero WCAG AA violations in axe audits
- ✅ All forms keyboard accessible
- ✅ ARIA labels present for dynamic content

### Module-Specific Criteria

**Authentication Module:**
- ✅ Signup, login, logout, protected routes all functional
- ✅ Sessions securely managed (HTTPOnly cookies)
- ✅ No information leakage in error messages

**Activities Module:**
- ✅ All CRUD operations work and persist correctly
- ✅ Optimistic updates appear immediately and rollback on error
- ✅ Month filtering and sorting work correctly
- ✅ RLS protects user data

**Motivation Module:**
- ✅ Messages generate successfully or show fallback
- ✅ Caching works and doesn't block app on API errors

### Pre-Release Checklist
- [ ] All automated tests pass
- [ ] Code coverage > 80%
- [ ] Security tests complete with no critical issues
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Manual E2E flows verified on staging
- [ ] All critical bugs fixed and verified
- [ ] Staging deployment successful
- [ ] Product Owner approval obtained

---

## 9. Roles & Responsibilities

### Developer
- Write unit tests for own code (minimum 80% coverage)
- Maintain integration tests for APIs and services
- Fix bugs reported by QA with regression tests
- Code review other developers' tests

### QA Engineer / Code Reviewer
- Maintain and update test plan
- Analyze automated test results and logs
- Perform manual E2E testing on staging
- Triage and report bugs with clear reproduction steps
- Verify bug fixes before closing issues

### DevOps Engineer
- Configure and maintain test environments (local, staging, production)
- Set up CI/CD pipeline and GitHub Actions workflows
- Configure testing tools (Lighthouse, axe DevTools)
- Monitor test performance and infrastructure

### Product Owner
- Prioritize test scenarios and release requirements
- Make final release approval decisions
- Manage stakeholder communication

---

## 10. Bug Reporting & Management

### Bug Report Template

```
**Title:** [Brief description]
**Priority:** Critical | High | Medium | Low

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- URL: https://staging.astrorunner.app/activities

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** [What should happen]
**Actual:** [What happened]

**Screenshots/Logs:** [Attachments]
**Reproducible:** Always | Sometimes | Rarely
**Workaround:** [If exists]
```

### Priority Levels

| Priority | Fix Time | Examples |
|----------|----------|----------|
| **Critical (P0)** | 24 hours | App won't load, can't login, data loss, critical security vulnerability |
| **High (P1)** | 3 days | Can't create activity (but can edit), error in display, major UX issue |
| **Medium (P2)** | 1 week | Layout issues, minor UI bugs, non-critical accessibility issues |
| **Low (P3)** | Backlog | UI suggestions, minor cosmetic issues, optimization improvements |

### Bug Management Process

1. **Report** → QA creates GitHub issue with template
2. **Triage** → Dev verifies reproducibility
3. **Fix** → Dev creates feature branch and writes regression tests
4. **Verify** → QA tests fix on staging
5. **Close** → Issue closed when verified, linked to PR

### Metrics to Track
- Number of bugs reported/fixed per week
- Average fix time by priority
- Bug reopened rate
- Test coverage trend

---

## Appendix: Quick Reference

### Test Naming Convention

```typescript
// Unit tests
describe('validateIsoDate', () => {
  it('should accept valid ISO-8601 dates', () => {});
  it('should reject invalid formats', () => {});
});

// Integration tests
describe('POST /api/activities', () => {
  it('should create activity with valid data', async () => {});
});

// E2E tests
test('user can create and edit an activity', async ({ page }) => {});
```

### Key File Locations

```
src/lib/validators.ts              # Zod schemas
src/lib/services/activity.service.ts  # Activity business logic
src/lib/mappers/activity.mapper.ts    # DTO transformations
src/pages/api/activities.ts            # API endpoints
src/components/hooks/useActivities.ts  # Activity state management
vitest.config.ts                    # Test configuration
```

### Common Commands

```bash
npm run dev              # Start dev server
npm run test             # Run all tests (when added)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run build           # Build for production
```

---

**Document Status:** Living document - update as project evolves
**Last Reviewed:** 2025-11-23
