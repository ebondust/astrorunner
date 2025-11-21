# Authentication System Architecture Specification

**Project:** AstroRunner (Activity Logger)
**Version:** 1.0
**Date:** 2025-11-21
**Status:** Technical Specification (Ready for Implementation)

---

## Table of Contents

1. [Overview](#overview)
2. [User Interface Architecture](#1-user-interface-architecture)
3. [Backend Logic](#2-backend-logic)
4. [Authentication System](#3-authentication-system)
5. [Component Contracts](#4-component-contracts)
6. [Data Flow Diagrams](#5-data-flow-diagrams)
7. [Security Considerations](#6-security-considerations)
8. [Implementation Checklist](#7-implementation-checklist)

---

## Overview

This specification details the authentication system architecture for AstroRunner, implementing user registration, login, logout, and password recovery functionality using Supabase Auth integrated with Astro 5's SSR capabilities.

### Key Requirements

- User registration with email/password (FR-001)
- Secure login with session management (FR-002)
- Password reset functionality (FR-003)
- HTTPS enforcement and GDPR compliance
- Mobile-first, minimalist design
- No email verification in MVP (deferred to Phase 2)

### Architecture Principles

- Server-side session management using Supabase Auth
- HTTPOnly cookies for JWT storage (security)
- Astro middleware for authentication checks
- Row Level Security (RLS) for data protection
- Optimistic UI with proper error handling
- Graceful degradation and session refresh

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure Overview

The application operates in two distinct UI modes:

**Unauthenticated Mode:**
- Minimal layouts for authentication flows
- Pages: `/login`, `/signup`, `/password-reset`
- No navigation bar or user menu
- Centered, focused design with logo/branding

**Authenticated Mode:**
- Full application layout with TopBar
- Pages: `/activities` (existing), `/profile` (new)
- Persistent navigation and user menu
- Protected by middleware authentication checks

### 1.2 New Pages

#### 1.2.1 `/login` - Login Page

**File:** `src/pages/login.astro`

**Purpose:** User authentication entry point

**Responsibilities:**
- Check if user already authenticated → redirect to `/activities`
- Render login form with email/password inputs
- Handle return URL for post-login redirect
- Display generic error messages (no user enumeration)

**UI Components:**
- `LoginForm` (React island) - Email, password, submit button
- "Forgot password?" link → `/password-reset`
- "Create account" link → `/signup`
- Error banner for authentication failures

**Validation:**
- Email: required, valid format
- Password: required, non-empty
- Client-side validation for UX, server-side for security

---

#### 1.2.2 `/signup` - Registration Page

**File:** `src/pages/signup.astro`

**Purpose:** New user account creation

**Responsibilities:**
- Check if user already authenticated → redirect to `/activities`
- Render signup form with validation
- Display password strength requirements
- Create user account and profile on success

**UI Components:**
- `SignupForm` (React island) - Email, password, confirm password
- `PasswordStrengthIndicator` - Visual feedback (5 levels: 0-4)
- Error banner for validation/creation failures
- "Already have account?" link → `/login`

**Validation:**
- Email: required, valid format, unique (server-side)
- Password: min 8 chars, uppercase, lowercase, number
- Confirm password: matches password field
- Real-time strength feedback

---

#### 1.2.3 `/password-reset` - Password Recovery

**File:** `src/pages/password-reset.astro`

**Purpose:** Initiate password reset via email

**Responsibilities:**
- Render email input form
- Trigger password reset email via Supabase
- Display generic success message (security)

**UI Components:**
- `PasswordResetForm` (React island) - Email input, submit
- Success message: "If account exists, you'll receive a reset link"
- "Back to Login" link → `/login`

**Security:**
- Always show generic success (prevents email enumeration)
- Rate limiting on requests (3 per hour per email)

---

#### 1.2.4 `/profile` - User Settings

**File:** `src/pages/profile.astro`

**Purpose:** Manage user preferences and account settings

**Responsibilities:**
- Require authentication (middleware enforced)
- Fetch user profile from database
- Display user email (read-only)
- Allow distance unit preference change (km/mi)

**UI Components:**
- `ProfileForm` (React island) - Distance unit selector, save button
- Email display (read-only)
- Success/error message banners
- Optional: "Change Password" link (Supabase-hosted flow)

**Layout:** Uses existing `AuthenticatedLayout` with `TopBar`

---

### 1.3 Existing Pages to Modify

#### 1.3.1 `/` - Landing Page (Root)

**Current:** Shows welcome page
**New:** Route based on authentication status

**Logic:**
- If authenticated → redirect to `/activities`
- If not authenticated → redirect to `/login`

**Rationale:** No static landing needed; direct users to appropriate page

---

#### 1.3.2 `/activities` - Activity List

**Current:** Uses `DEFAULT_USER_ID` constant
**New:** Use real authenticated user

**Changes Required:**
- Remove `DEFAULT_USER_ID` usage
- Fetch authenticated user from session
- Fetch user profile for distance unit preference
- Pass real user data to components

---

### 1.4 New Layouts

#### 1.4.1 `UnauthenticatedLayout`

**File:** `src/layouts/UnauthenticatedLayout.astro`

**Purpose:** Minimal wrapper for auth pages

**Structure:**
- Centered container (max-width: 28rem)
- Logo/branding at top
- Main content slot (forms)
- Optional footer with legal links

**Styling:** Clean, focused design with no navigation

---

### 1.5 New React Components

#### 1.5.1 `LoginForm`

**File:** `src/components/LoginForm.tsx`

**Responsibilities:**
- Render email/password inputs
- Client-side validation
- Submit to `POST /api/auth/login`
- Handle loading states and errors
- Redirect on success

**Props:**
```typescript
interface LoginFormProps {
  returnTo?: string;
}
```

---

#### 1.5.2 `SignupForm`

**File:** `src/components/SignupForm.tsx`

**Responsibilities:**
- Render email/password/confirm password inputs
- Real-time password strength validation
- Submit to `POST /api/auth/signup`
- Handle validation errors
- Redirect to `/activities` on success

**Integration:**
- Includes `PasswordStrengthIndicator` component
- Field-level and form-level error display

---

#### 1.5.3 `PasswordStrengthIndicator`

**File:** `src/components/PasswordStrengthIndicator.tsx`

**Responsibilities:**
- Visual progress bar (5 segments)
- Color coding: red (weak) → green (strong)
- Text feedback listing missing requirements

**Props:**
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**Algorithm:**
- Score 0-4 based on criteria met
- Criteria: length ≥8, lowercase, uppercase, number

---

#### 1.5.4 `PasswordResetForm`

**File:** `src/components/PasswordResetForm.tsx`

**Responsibilities:**
- Render email input
- Submit to `POST /api/auth/password-reset`
- Display generic success message
- Handle errors

---

#### 1.5.5 `ProfileForm`

**File:** `src/components/ProfileForm.tsx`

**Responsibilities:**
- Display email (read-only)
- Distance unit radio button group (km/mi)
- Submit changes to `PATCH /api/profile`
- Show success message and redirect

**Props:**
```typescript
interface ProfileFormProps {
  initialDistanceUnit: 'km' | 'mi';
  userEmail: string;
}
```

---

#### 1.5.6 `UserMenu` (Modify Existing)

**File:** `src/components/UserMenu.tsx`

**Changes Required:**
- Add "Profile" link → `/profile`
- Implement real logout functionality
- Call `POST /api/auth/logout` on logout click
- Redirect to `/login` after logout

---

### 1.6 Component Hierarchy

```
Unauthenticated Pages:
├── /login
│   └── UnauthenticatedLayout
│       └── LoginForm (React island)
│
├── /signup
│   └── UnauthenticatedLayout
│       └── SignupForm (React island)
│           └── PasswordStrengthIndicator
│
└── /password-reset
    └── UnauthenticatedLayout
        └── PasswordResetForm (React island)

Authenticated Pages:
├── /activities (modified)
│   └── AuthenticatedLayout
│       ├── TopBar → UserMenu (modified)
│       └── ActivitiesPageContainer
│
└── /profile (new)
    └── AuthenticatedLayout
        ├── TopBar → UserMenu
        └── ProfileForm (React island)
```

---

### 1.7 Navigation Flows

**New User Journey:**
```
/ → /login → [Click "Sign up"] → /signup → [Submit] → /activities
```

**Existing User Journey:**
```
/ → /login → [Submit credentials] → /activities
```

**Logout Journey:**
```
/activities → [User menu] → [Logout] → /login
```

**Password Reset Journey:**
```
/login → [Forgot password?] → /password-reset → [Email sent] →
[User checks email] → [Supabase reset page] → /login
```

**Profile Management:**
```
/activities → [User menu] → [Profile] → /profile → [Save] → /activities
```

---

### 1.8 Error Handling Strategy

**Form-Level Errors:**
- Display in banner at top of form
- Red background, white text, dismissible
- Examples: "Invalid credentials", "Email already exists"

**Field-Level Errors:**
- Display below input field
- Small red text
- Associated via `aria-describedby`

**Success Messages:**
- Green banner, auto-dismiss after 3 seconds
- Examples: "Profile updated", "Reset link sent"

**Loading States:**
- Button shows spinner and disabled state
- Form inputs disabled during submission
- Prevents double submission

---

### 1.9 Accessibility Requirements

- WCAG AA compliance (4.5:1 contrast ratio)
- Keyboard navigation throughout
- Screen reader support (ARIA labels, live regions)
- Focus management (trap in modals, return on close)
- Skip links for keyboard users
- High contrast text and visible focus indicators

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints

#### 2.1.1 `POST /api/auth/signup`

**File:** `src/pages/api/auth/signup.ts`

**Purpose:** Create new user account and profile

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Responsibilities:**
1. Validate input (email format, password strength)
2. Call `supabase.auth.signUp()`
3. Create profile record with default preferences
4. Return user data or error

**Response (201):**
```typescript
{
  userId: string;
  email: string;
}
```

**Error Codes:** 400, 409 (email exists), 500

---

#### 2.1.2 `POST /api/auth/login`

**File:** `src/pages/api/auth/login.ts`

**Purpose:** Authenticate user and establish session

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Responsibilities:**
1. Validate input
2. Call `supabase.auth.signInWithPassword()`
3. Set HTTPOnly session cookie
4. Return user data or generic error

**Response (200):**
```typescript
{
  userId: string;
  email: string;
}
```

**Error Codes:** 400, 401 (generic: "Invalid credentials"), 500

**Security:** Generic error prevents user enumeration

---

#### 2.1.3 `POST /api/auth/logout`

**File:** `src/pages/api/auth/logout.ts`

**Purpose:** Invalidate session and clear cookies

**Responsibilities:**
1. Call `supabase.auth.signOut()`
2. Clear session cookie
3. Return success (idempotent)

**Response:** 204 No Content

**Note:** Always returns success even if already logged out

---

#### 2.1.4 `POST /api/auth/password-reset`

**File:** `src/pages/api/auth/password-reset.ts`

**Purpose:** Initiate password reset via email

**Request Body:**
```typescript
{
  email: string;
}
```

**Responsibilities:**
1. Validate email format
2. Call `supabase.auth.resetPasswordForEmail()`
3. Always return 202 Accepted (security)

**Response:** 202 Accepted (always)

**Security:** Never reveals if email exists

---

#### 2.1.5 `GET /api/profile`

**File:** `src/pages/api/profile.ts`

**Purpose:** Fetch authenticated user's profile

**Responsibilities:**
1. Verify authentication
2. Fetch profile from database
3. Auto-create if missing (edge case)
4. Return profile data

**Response (200):**
```typescript
{
  userId: string;
  distanceUnit: 'km' | 'mi';
}
```

**Error Codes:** 401, 500

---

#### 2.1.6 `PATCH /api/profile`

**File:** `src/pages/api/profile.ts`

**Purpose:** Update user profile preferences

**Request Body:**
```typescript
{
  distanceUnit: 'km' | 'mi';
}
```

**Responsibilities:**
1. Verify authentication
2. Validate input
3. Update profile in database
4. Return updated profile

**Response (200):**
```typescript
{
  userId: string;
  distanceUnit: 'km' | 'mi';
}
```

**Error Codes:** 400, 401, 500

---

### 2.2 Middleware Architecture

**File:** `src/middleware/index.ts`

**Current:** Only injects Supabase client
**New:** Add authentication enforcement

**Responsibilities:**
1. Create Supabase client with SSR cookie handling
2. Inject client into `context.locals.supabase`
3. Define public paths (no auth required)
4. Check authentication for protected routes
5. Redirect unauthenticated users to `/login?returnTo=...`
6. Store authenticated user in `context.locals.user`

**Public Paths (no auth):**
- `/login`
- `/signup`
- `/password-reset`
- `/api/auth/*` (auth endpoints)

**Protected Paths (require auth):**
- All other routes

**Technology:** Use `@supabase/ssr` package for proper SSR cookie handling

---

### 2.3 Validation Architecture

**File:** `src/lib/validators.ts` (add to existing)

**New Schemas:**

```typescript
// Signup validation
signupCommandSchema: {
  email: string (email format)
  password: string (min 8, uppercase, lowercase, number)
}

// Login validation
loginCommandSchema: {
  email: string (email format)
  password: string (non-empty)
}

// Password reset validation
passwordResetCommandSchema: {
  email: string (email format)
}

// Profile patch validation
profilePatchCommandSchema: {
  distanceUnit: 'km' | 'mi' (enum)
}
```

**Validation Strategy:**
- Client-side: UX feedback, instant validation
- Server-side: Security, never trust client
- Use Zod for schema validation
- Return detailed validation errors

---

### 2.4 Type System Updates

**File:** `src/env.d.ts`

**Add to Astro Locals:**
```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user?: User; // Add authenticated user
  }
}
```

**File:** `src/types.ts`

**Note:** Auth types already defined in existing file:
- `AuthSignupCommand`
- `AuthLoginCommand`
- `AuthPasswordResetCommand`
- `AuthUserBasicDto`
- `ProfileDto`
- `ProfilePatchCommand`

---

### 2.5 Error Response Format

**Standard Error Response:**
```typescript
{
  error: {
    message: string;
    correlationId?: string;
    details?: unknown;
  }
}
```

**Error Helpers (use existing from `src/lib/api/errors.ts`):**
- `badRequest(message, details?)` → 400
- `unauthorized(message)` → 401
- `conflict(message)` → 409
- `internalServerError(correlationId)` → 500

---

### 2.6 Astro Configuration

**File:** `astro.config.mjs`

**Current Configuration:**
```javascript
{
  output: "server",
  adapter: node({ mode: "standalone" })
}
```

**Status:** Already configured for SSR - no changes needed

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Technology Stack

**Primary:** Supabase Auth (hosted authentication service)

**Packages:**
- `@supabase/supabase-js` (existing) - Main Supabase client
- `@supabase/ssr` (new, required) - SSR cookie handling for Astro

**Installation:**
```bash
npm install @supabase/ssr
```

---

### 3.2 Session Management

**Storage:** HTTPOnly cookies (managed by Supabase)

**Cookie Attributes:**
- `httpOnly: true` - Prevents XSS access
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Site-wide availability
- `maxAge: 604800` - 7 days (configurable)

**Session Tokens:**
- Access token: 1 hour lifetime (default)
- Refresh token: 7 days lifetime (default)
- Automatic refresh handled by Supabase client

**Session Refresh Strategy:**
- Middleware checks session on each request
- Attempts refresh if access token expired
- Redirects to login if refresh fails
- Transparent to user when successful

---

### 3.3 Authentication Flows

#### 3.3.1 Registration Flow

```
User → /signup form → POST /api/auth/signup
  → Supabase creates auth.users entry
  → Server creates profiles entry
  → Session cookie set
  → Redirect to /activities
```

**Edge Cases:**
- Email exists → 409 Conflict
- Weak password → 400 Bad Request
- Profile creation fails → Log error, continue (user can still use app)

---

#### 3.3.2 Login Flow

```
User → /login form → POST /api/auth/login
  → Supabase validates credentials
  → Session cookie set
  → Redirect to returnTo or /activities
```

**Edge Cases:**
- Invalid credentials → 401 with generic message
- Account locked → 401 with generic message
- Too many attempts → 429 Rate Limited

---

#### 3.3.3 Logout Flow

```
User → UserMenu logout → POST /api/auth/logout
  → Supabase invalidates session
  → Cookie cleared
  → Redirect to /login
```

**Edge Cases:**
- Already logged out → Still returns 204
- Network error → Client still redirects

---

#### 3.3.4 Password Reset Flow

```
User → /password-reset → POST /api/auth/password-reset
  → Supabase sends email with token
  → User clicks link → Supabase-hosted reset page
  → User sets new password → Redirect to /login
```

**Security:**
- Token expires after 1 hour
- Single-use token
- Generic success message (no email enumeration)

---

### 3.4 Row Level Security Integration

**How RLS Works:**
1. User authenticates via Supabase Auth
2. JWT contains `user_id` claim
3. PostgreSQL extracts `user_id` via `auth.uid()`
4. RLS policies filter all queries automatically

**Existing Policies (already in place):**

**Profiles table:**
- Users can only access their own profile
- Policy: `user_id = auth.uid()`

**Activities table:**
- Users can only access their own activities
- Policy: `user_id = auth.uid()`

**Application Impact:**
- No `WHERE user_id = ...` needed in queries
- Database enforces access control
- Defense in depth (even if app has bug)

**Important:** Never use service role key in production (bypasses RLS)

---

### 3.5 Client Configuration Changes

**Current (REMOVE):**
- Global `supabaseClient` in `src/db/supabase.client.ts`
- `DEFAULT_USER_ID` constant

**New Architecture:**
- Per-request client created in middleware
- Uses `@supabase/ssr` for cookie handling
- No global client (SSR incompatible)

**Middleware Responsibility:**
- Create client with cookie handlers
- Inject into `context.locals.supabase`
- All pages/API routes use injected client

---

### 3.6 Environment Variables

**Required Variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key  # Public anon key (safe)
```

**Important Security Notes:**
- `SUPABASE_KEY` is the **anon key** (public, safe to expose)
- Never use `SUPABASE_SERVICE_ROLE_KEY` in production
- Service role key bypasses RLS (dangerous)
- For local dev only, can use service role if RLS testing disabled

---

## 4. COMPONENT CONTRACTS

### 4.1 React Component Props

**LoginForm:**
```typescript
interface LoginFormProps {
  returnTo?: string;
}
```

**SignupForm:**
```typescript
// No props - redirects to /activities on success
```

**PasswordStrengthIndicator:**
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**PasswordResetForm:**
```typescript
// No props
```

**ProfileForm:**
```typescript
interface ProfileFormProps {
  initialDistanceUnit: 'km' | 'mi';
  userEmail: string;
}
```

**UserMenu (modified):**
```typescript
interface UserMenuProps {
  user: {
    email: string;
  };
}
```

---

### 4.2 API Contracts

**POST /api/auth/signup:**
```typescript
Request:  { email: string, password: string }
Response: { userId: string, email: string }
Errors:   400, 409, 500
```

**POST /api/auth/login:**
```typescript
Request:  { email: string, password: string }
Response: { userId: string, email: string }
Errors:   400, 401, 500
```

**POST /api/auth/logout:**
```typescript
Request:  (none)
Response: 204 No Content
Errors:   500
```

**POST /api/auth/password-reset:**
```typescript
Request:  { email: string }
Response: 202 Accepted (always)
Errors:   400, 500
```

**GET /api/profile:**
```typescript
Request:  (none, uses session)
Response: { userId: string, distanceUnit: 'km'|'mi' }
Errors:   401, 500
```

**PATCH /api/profile:**
```typescript
Request:  { distanceUnit: 'km'|'mi' }
Response: { userId: string, distanceUnit: 'km'|'mi' }
Errors:   400, 401, 500
```

---

### 4.3 Database Schema

**No changes required** - existing schema already supports authentication:

**auth.users (Supabase managed):**
- Contains user credentials
- Managed entirely by Supabase Auth

**profiles table (existing):**
- `user_id` (FK to auth.users)
- `distance_unit` (km/mi preference)
- RLS policies already in place

**activities table (existing):**
- `user_id` (FK to profiles)
- RLS policies already in place

---

## 5. DATA FLOW DIAGRAMS

### 5.1 Registration Flow

```
┌─────────────┐
│   Browser   │ 1. User fills signup form
│   /signup   │ 2. Client validates
└──────┬──────┘ 3. POST /api/auth/signup
       │
       ▼
┌─────────────────────────────────────┐
│  API: /api/auth/signup              │
│  • Validate input (Zod)             │
│  • supabase.auth.signUp()           │
│  • Create profile record            │
│  • Return success/error             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  • Hash password    │
│  • Create user      │
│  • Generate JWT     │
│  • Set cookie       │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│   Browser   │ Redirect to /activities
└─────────────┘
```

---

### 5.2 Login Flow

```
┌─────────────┐
│   Browser   │ 1. User fills login form
│   /login    │ 2. Client validates
└──────┬──────┘ 3. POST /api/auth/login
       │
       ▼
┌─────────────────────────────────────┐
│  API: /api/auth/login               │
│  • Validate input (Zod)             │
│  • supabase.auth.signInWithPassword │
│  • Return success/error             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  • Verify email     │
│  • Verify password  │
│  • Generate JWT     │
│  • Set cookie       │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│   Browser   │ Redirect to /activities
└─────────────┘
```

---

### 5.3 Protected Page Access

```
┌─────────────┐
│   Browser   │ GET /activities
│ (with cookie)│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Middleware                         │
│  • Create Supabase client (SSR)     │
│  • Check if path is public          │
│  • If protected: verify session     │
│  • If no session: redirect /login   │
│  • If valid: set context.locals.user│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Page: /activities                  │
│  • Access user from context.locals  │
│  • Fetch profile                    │
│  • Fetch activities (RLS filtered)  │
│  • Render page                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Browser   │ Display activities
└─────────────┘
```

---

### 5.4 API Request with Auth

```
┌─────────────┐
│   React     │ POST /api/activities
│ Component   │ (cookie included)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API Endpoint                       │
│  • Get client from context.locals   │
│  • supabase.auth.getUser()          │
│  • If no user: return 401           │
│  • Use user.id for operations       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│  PostgreSQL + RLS   │
│  • Filter query by  │
│    auth.uid()       │
│  • Return only      │
│    user's data      │
└─────────────────────┘
```

---

## 6. SECURITY CONSIDERATIONS

### 6.1 Authentication Security

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Hashed with bcrypt (Supabase)

**Session Security:**
- HTTPOnly cookies (XSS protection)
- Secure flag (HTTPS only)
- SameSite=Lax (CSRF protection)
- JWT signed and verified by Supabase
- 1 hour access token, 7 day refresh token

**Rate Limiting:**
- Login: 5 attempts per minute per IP
- Signup: 3 per hour per IP
- Password reset: 3 per hour per email
- API: 60 requests per minute per user

**User Enumeration Prevention:**
- Login: Generic "Invalid credentials" (never "user not found")
- Password reset: Always "email sent" (even if email doesn't exist)
- Signup: Only reveals email exists on actual signup attempt

---

### 6.2 Data Protection

**Row Level Security (RLS):**
- Enabled on all tables (profiles, activities)
- Policies use `auth.uid()` from JWT
- Enforced at database level
- Cannot be bypassed from application

**HTTPS Enforcement:**
- All traffic over HTTPS in production
- Configured at hosting/proxy level
- HTTP redirects to HTTPS
- HSTS header enabled

**GDPR Compliance:**
- Minimal data collection (email, activities)
- User can delete account (cascades)
- No tracking cookies
- No third-party analytics by default

---

### 6.3 XSS Prevention

- React escapes output automatically
- No `dangerouslySetInnerHTML` usage
- Content-Type validation on all API endpoints
- Input sanitization with Zod

---

### 6.4 CSRF Prevention

- SameSite cookies (prevents external CSRF)
- State verification in forms
- Supabase handles token validation

---

### 6.5 SQL Injection Prevention

- Supabase uses parameterized queries
- No raw SQL in application
- RLS provides additional protection layer

---

### 6.6 Secrets Management

**Environment Variables:**
- Sensitive keys in `.env` (not committed)
- `.env.example` provides template
- Never use service role key in production

**Key Rotation:**
- Anon key can be rotated in Supabase dashboard
- JWT secret managed by Supabase
- Document rotation procedure

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Install `@supabase/ssr` package
- [ ] Update `src/env.d.ts` (add user to Locals)
- [ ] Add auth validation schemas to `src/lib/validators.ts`
- [ ] Remove `DEFAULT_USER_ID` from codebase

### Phase 2: Middleware
- [ ] Modify `src/middleware/index.ts` for SSR auth
- [ ] Test protected route redirects
- [ ] Test public route access
- [ ] Test session refresh logic

### Phase 3: API Endpoints
- [ ] Create `src/pages/api/auth/signup.ts`
- [ ] Create `src/pages/api/auth/login.ts`
- [ ] Create `src/pages/api/auth/logout.ts`
- [ ] Create `src/pages/api/auth/password-reset.ts`
- [ ] Create `src/pages/api/profile.ts` (GET, PATCH)
- [ ] Test all endpoints

### Phase 4: Components
- [ ] Create `src/components/LoginForm.tsx`
- [ ] Create `src/components/SignupForm.tsx`
- [ ] Create `src/components/PasswordStrengthIndicator.tsx`
- [ ] Create `src/components/PasswordResetForm.tsx`
- [ ] Create `src/components/ProfileForm.tsx`
- [ ] Modify `src/components/UserMenu.tsx`

### Phase 5: Layouts & Pages
- [ ] Create `src/layouts/UnauthenticatedLayout.astro`
- [ ] Create `src/pages/login.astro`
- [ ] Create `src/pages/signup.astro`
- [ ] Create `src/pages/password-reset.astro`
- [ ] Create `src/pages/profile.astro`
- [ ] Modify `src/pages/index.astro`
- [ ] Modify `src/pages/activities.astro`

### Phase 6: Integration Testing
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test logout flow
- [ ] Test password reset (requires email config)
- [ ] Test profile update
- [ ] Test protected page access
- [ ] Test RLS policies (users see only own data)

### Phase 7: Security Audit
- [ ] Verify input validation on all endpoints
- [ ] Verify generic error messages
- [ ] Verify HTTPOnly cookies
- [ ] Verify HTTPS enforcement
- [ ] Verify rate limiting
- [ ] Verify no passwords in logs

### Phase 8: Deployment
- [ ] Test production build
- [ ] Deploy to DigitalOcean
- [ ] Verify HTTPS in production
- [ ] Monitor logs for errors
- [ ] Document known issues

---

## Summary

This architecture specification defines a complete authentication system for AstroRunner using Supabase Auth with Astro SSR.

**Key Components:**
- 3 new unauthenticated pages (login, signup, password reset)
- 1 new authenticated page (profile)
- 6 new React components
- 5 new API endpoints
- Enhanced middleware with auth enforcement
- Proper SSR session management

**Security Features:**
- HTTPOnly cookies for JWT storage
- Row Level Security at database level
- Rate limiting and HTTPS enforcement
- Generic error messages (no user enumeration)
- GDPR compliance and data minimization

**Technology:**
- Supabase Auth for authentication
- `@supabase/ssr` for SSR cookie handling
- Astro middleware for route protection
- Zod for validation
- React for interactive components

**Implementation Estimate:** ~34 hours total development time

The architecture maintains compatibility with existing features while adding robust, production-ready authentication.
