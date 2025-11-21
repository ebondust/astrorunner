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

**Key Requirements:**
- User registration with email/password (FR-001)
- Secure login with session management (FR-002)
- Password reset functionality (FR-003)
- HTTPS enforcement and GDPR compliance
- Mobile-first, minimalist design
- No email verification in MVP (deferred to Phase 2)

**Architecture Principles:**
- Server-side session management using Supabase Auth
- HTTPOnly cookies for JWT storage (security)
- Astro middleware for authentication checks
- Row Level Security (RLS) for data protection
- Optimistic UI with proper error handling
- Graceful degradation and session refresh

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure Overview

The application has two distinct UI modes:

**Unauthenticated Mode:**
- Minimal layouts for auth flows
- Pages: `/login`, `/signup`, `/password-reset`
- No navigation bar or user menu
- Simple, focused design

**Authenticated Mode:**
- Full application layout with TopBar
- Pages: `/activities` (existing), `/profile` (new)
- Persistent navigation and user menu
- Protected by middleware

### 1.2 New Pages to Create

#### 1.2.1 `/login` - Login Page (NEW)

**File Location:** `src/pages/login.astro`

**Purpose:** Allow existing users to authenticate and access their activity data.

**Layout:** Uses `UnauthenticatedLayout` (to be created)

**Server-Side Logic (Astro Frontmatter):**
```typescript
export const prerender = false; // Enable SSR

// Check if user is already authenticated
const { data: { session } } = await supabase.auth.getSession();

// If authenticated, redirect to activities
if (session) {
  return Astro.redirect('/activities');
}

// Get return URL from query params (for post-login redirect)
const returnTo = Astro.url.searchParams.get('returnTo') || '/activities';
```

**UI Components:**
- `LoginForm` (React island, client:load)
  - Email input (type="email", required, autofocus)
  - Password input (type="password", required)
  - "Forgot password?" link → `/password-reset`
  - "Login" button (primary action)
  - Loading state during submission
  - Error banner for failed authentication
- Link to signup: "Don't have an account? Sign up"

**Validation Rules:**
- Email: required, valid email format
- Password: required, non-empty
- Generic error message on failure: "Invalid credentials"

**User Actions:**
1. User fills email and password
2. Clicks "Login" button
3. Form submits to API endpoint: `POST /api/auth/login`
4. On success: Redirect to `returnTo` URL or `/activities`
5. On failure: Display generic error message

---

#### 1.2.2 `/signup` - Registration Page (NEW)

**File Location:** `src/pages/signup.astro`

**Purpose:** Allow new users to create an account.

**Layout:** Uses `UnauthenticatedLayout`

**Server-Side Logic (Astro Frontmatter):**
```typescript
export const prerender = false;

// Check if user is already authenticated
const { data: { session } } = await supabase.auth.getSession();

// If authenticated, redirect to activities
if (session) {
  return Astro.redirect('/activities');
}
```

**UI Components:**
- `SignupForm` (React island, client:load)
  - Email input (type="email", required, autofocus)
  - Password input (type="password", required)
  - Confirm password input (type="password", required)
  - `PasswordStrengthIndicator` (visual feedback)
  - "Sign Up" button (primary action)
  - Loading state during submission
  - Error banner for validation/signup failures
  - Field-level inline error messages
- Link to login: "Already have an account? Log in"

**Validation Rules:**
- Email: required, valid format, unique (checked server-side)
- Password: required, min 8 characters, contains uppercase, lowercase, number
- Confirm password: required, must match password
- Real-time validation on blur

**Password Strength Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended but not required

**User Actions:**
1. User fills email, password, confirm password
2. Password strength indicator shows visual feedback
3. Clicks "Sign Up" button
4. Form submits to API endpoint: `POST /api/auth/signup`
5. On success: Automatically creates user profile, redirects to `/activities`
6. On failure: Display specific error (email exists, weak password, etc.)

---

#### 1.2.3 `/password-reset` - Password Reset Request Page (NEW)

**File Location:** `src/pages/password-reset.astro`

**Purpose:** Allow users to initiate password reset via email.

**Layout:** Uses `UnauthenticatedLayout`

**Server-Side Logic (Astro Frontmatter):**
```typescript
export const prerender = false;

// No auth check needed - this page is for unauthenticated users
```

**UI Components:**
- `PasswordResetForm` (React island, client:load)
  - Email input (type="email", required, autofocus)
  - Instructional text: "Enter your email to receive a password reset link"
  - "Send Reset Link" button (primary action)
  - Loading state during submission
  - Success message (generic for security)
  - Error message for invalid input
- Link back: "Back to Login" → `/login`

**Validation Rules:**
- Email: required, valid email format

**User Actions:**
1. User enters email address
2. Clicks "Send Reset Link" button
3. Form submits to API endpoint: `POST /api/auth/password-reset`
4. Generic success message displayed: "If an account exists with that email, you'll receive a reset link shortly."
5. User checks email for reset link (handled by Supabase)
6. Clicking reset link opens Supabase-hosted password reset page
7. After password reset, user redirects to `/login`

**Security Note:** Always show generic success message regardless of whether email exists (prevents user enumeration).

---

#### 1.2.4 `/profile` - User Profile Page (NEW)

**File Location:** `src/pages/profile.astro`

**Purpose:** Manage user preferences and account settings.

**Layout:** Uses `AuthenticatedLayout` (existing)

**Server-Side Logic (Astro Frontmatter):**
```typescript
export const prerender = false;

// Get authenticated user from session
const { data: { user }, error: authError } = await supabase.auth.getUser();

// If not authenticated, redirect to login
if (authError || !user) {
  return Astro.redirect('/login?returnTo=/profile');
}

// Fetch user profile from database
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// If profile doesn't exist, create it (edge case)
if (profileError || !profile) {
  await supabase.from('profiles').insert({
    user_id: user.id,
    distance_unit: 'km'
  });
}
```

**UI Components:**
- `TopBar` (existing, mounted in AuthenticatedLayout)
- `ProfileForm` (React island, client:load)
  - Username display (read-only, from auth.users.email)
  - Email display (read-only, non-editable)
  - `DistanceUnitSelector` (radio button group)
    - Option: Kilometers (km)
    - Option: Miles (mi)
  - "Save Changes" button (primary action)
  - Success/error message banner
- Optional: "Change Password" button (triggers Supabase password change flow)

**Validation Rules:**
- Distance unit: required, must be "km" or "mi"

**User Actions:**
1. User navigates to profile via TopBar user menu
2. Profile data loads from database
3. User changes distance unit preference
4. Clicks "Save Changes" button
5. Form submits to API endpoint: `PATCH /api/profile`
6. On success: Success message displayed, context updated, redirect to `/activities`
7. On failure: Error message displayed, form remains open

**Integration Points:**
- Distance unit preference stored in `profiles` table
- Preference used throughout app for distance display/input
- `UserPreferencesContext` (to be created) provides distance unit to all components

---

### 1.3 Existing Pages to Modify

#### 1.3.1 `/` - Landing Page (MODIFY)

**File Location:** `src/pages/index.astro`

**Current Behavior:** Shows welcome page to everyone

**New Behavior:**
- Check authentication status
- If authenticated: Redirect to `/activities`
- If not authenticated: Redirect to `/login`

**Modified Server-Side Logic:**
```typescript
export const prerender = false;

const { data: { session } } = await supabase.auth.getSession();

if (session) {
  return Astro.redirect('/activities');
} else {
  return Astro.redirect('/login');
}
```

**Rationale:** The landing page should route users to the appropriate location based on auth status. No static welcome page needed.

---

#### 1.3.2 `/activities` - Activity List Page (MODIFY)

**File Location:** `src/pages/activities.astro`

**Current Behavior:** Uses `DEFAULT_USER_ID` constant for testing

**New Behavior:**
- Enforce authentication via middleware
- Fetch real user from session
- Fetch user's profile for distance unit preference

**Modified Server-Side Logic:**
```typescript
export const prerender = false;

// Get authenticated user from session
const { data: { user }, error: authError } = await supabase.auth.getUser();

// If not authenticated, redirect to login (should be caught by middleware)
if (authError || !user) {
  return Astro.redirect('/login?returnTo=/activities');
}

// Fetch user profile for preferences
const { data: profile } = await supabase
  .from('profiles')
  .select('distance_unit')
  .eq('user_id', user.id)
  .single();

const distanceUnit = profile?.distance_unit || 'km';

// Build user DTO
const userDto: AuthUserBasicDto = {
  userId: user.id,
  email: user.email!,
};

// Rest of existing logic for motivation, etc.
// Replace DEFAULT_USER_ID with user.id
```

**Changes:**
- Remove `DEFAULT_USER_ID` usage
- Use real authenticated user
- Fetch profile for distance unit
- Pass real user data to components

---

### 1.4 New Layouts to Create

#### 1.4.1 `UnauthenticatedLayout` (NEW)

**File Location:** `src/layouts/UnauthenticatedLayout.astro`

**Purpose:** Minimal wrapper for authentication pages (login, signup, password reset).

**Structure:**
```astro
---
interface Props {
  title?: string;
}

const { title = "Activity Logger" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background">
    <div class="flex min-h-screen flex-col items-center justify-center p-4">
      <!-- Logo/Branding -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold">Activity Logger</h1>
      </div>

      <!-- Main content (form) -->
      <main class="w-full max-w-md">
        <slot />
      </main>

      <!-- Optional footer with legal links -->
      <footer class="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Activity Logger</p>
      </footer>
    </div>
  </body>
</html>
```

**Features:**
- Centered layout
- Logo/branding at top
- Max-width container for forms (max-w-md)
- Clean, focused design
- No navigation or user menu

---

### 1.5 New React Components to Create

#### 1.5.1 `LoginForm` Component (NEW)

**File Location:** `src/components/LoginForm.tsx`

**Purpose:** Login form with email/password inputs and submission handling.

**Props:**
```typescript
interface LoginFormProps {
  returnTo?: string; // URL to redirect after successful login
}
```

**State:**
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Validation:**
- Email: required, valid email format (client-side)
- Password: required, non-empty (client-side)
- All validation also happens server-side

**API Integration:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important: include cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Login failed');
    }

    // Success: redirect to returnTo or /activities
    window.location.href = returnTo || '/activities';
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

**UI Structure:**
- Email input (autofocus)
- Password input
- Error banner (if error)
- Login button (loading state)
- "Forgot password?" link
- "Sign up" link

**Accessibility:**
- Proper label associations
- Error announcements (aria-live)
- Keyboard navigation
- Focus management

---

#### 1.5.2 `SignupForm` Component (NEW)

**File Location:** `src/components/SignupForm.tsx`

**Purpose:** Registration form with email/password inputs and password strength validation.

**Props:** None (redirects to /activities on success)

**State:**
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

**Password Strength Validation:**
```typescript
const calculatePasswordStrength = (password: string): {
  score: number; // 0-4
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('One lowercase letter');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('One uppercase letter');

  if (/\d/.test(password)) score++;
  else feedback.push('One number');

  return { score, feedback };
};
```

**Validation:**
- Email: required, valid format
- Password: required, meets strength requirements
- Confirm password: required, matches password
- Real-time validation on blur

**API Integration:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Clear errors
  setError(null);
  setFieldErrors({});

  // Client-side validation
  const errors: Record<string, string> = {};

  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  const { score } = calculatePasswordStrength(password);
  if (score < 3) {
    errors.password = 'Password is too weak';
  }

  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Signup failed');
    }

    // Success: redirect to activities
    window.location.href = '/activities';
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Signup failed');
  } finally {
    setLoading(false);
  }
};
```

**UI Structure:**
- Email input (autofocus)
- Password input
- `PasswordStrengthIndicator` (visual feedback)
- Confirm password input
- Error banner (if error)
- Field-level error messages
- Sign up button (loading state)
- "Login" link

---

#### 1.5.3 `PasswordStrengthIndicator` Component (NEW)

**File Location:** `src/components/PasswordStrengthIndicator.tsx`

**Purpose:** Visual feedback for password strength.

**Props:**
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**UI Structure:**
- Progress bar showing strength (0-4)
- Color coding:
  - 0-1: Red (Weak)
  - 2: Orange (Fair)
  - 3: Yellow (Good)
  - 4: Green (Strong)
- Text feedback listing missing requirements

**Implementation:**
```typescript
export function PasswordStrengthIndicator({ password }: Props) {
  const { score, feedback } = calculatePasswordStrength(password);

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i <= score ? strengthColors[score] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <div className="text-sm">
        <span className="font-medium">
          Strength: {strengthLabels[score]}
        </span>
        {feedback.length > 0 && (
          <ul className="mt-1 text-muted-foreground">
            {feedback.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

#### 1.5.4 `PasswordResetForm` Component (NEW)

**File Location:** `src/components/PasswordResetForm.tsx`

**Purpose:** Password reset request form with email input.

**Props:** None

**State:**
```typescript
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**API Integration:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Request failed');
    }

    // Show success message (generic for security)
    setSuccess(true);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Request failed');
  } finally {
    setLoading(false);
  }
};
```

**UI Structure:**
- Instructional text
- Email input (autofocus)
- Error message (if error)
- Success message (if success)
- "Send Reset Link" button (loading state)
- "Back to Login" link

---

#### 1.5.5 `ProfileForm` Component (NEW)

**File Location:** `src/components/ProfileForm.tsx`

**Purpose:** User profile settings form with distance unit preference.

**Props:**
```typescript
interface ProfileFormProps {
  initialDistanceUnit: 'km' | 'mi';
  userEmail: string;
}
```

**State:**
```typescript
const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>(initialDistanceUnit);
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**API Integration:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  try {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceUnit }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Update failed');
    }

    setSuccess(true);

    // Redirect to activities after brief delay
    setTimeout(() => {
      window.location.href = '/activities';
    }, 1500);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Update failed');
  } finally {
    setLoading(false);
  }
};
```

**UI Structure:**
- Email display (read-only)
- Distance unit radio button group
  - Kilometers (km)
  - Miles (mi)
- Success banner (if success)
- Error banner (if error)
- "Save Changes" button (loading state)

---

#### 1.5.6 `UserMenu` Component (MODIFY)

**File Location:** `src/components/UserMenu.tsx`

**Current Behavior:** Shows username, no actual logout

**New Behavior:**
- Add "Profile" link
- Implement real logout functionality

**Modified Structure:**
```typescript
const handleLogout = async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('Logout failed:', err);
    // Still redirect on error (client-side cleanup)
    window.location.href = '/login';
  }
};
```

**UI Structure:**
- Username display (non-interactive)
- "Profile" link → `/profile`
- Divider
- "Logout" button (triggers handleLogout)

---

### 1.6 Component Hierarchy

```
Unauthenticated Pages:
/login
└── UnauthenticatedLayout
    └── LoginForm (React island)

/signup
└── UnauthenticatedLayout
    └── SignupForm (React island)
        └── PasswordStrengthIndicator

/password-reset
└── UnauthenticatedLayout
    └── PasswordResetForm (React island)

Authenticated Pages:
/activities (existing, modified)
└── AuthenticatedLayout
    ├── TopBar (React island)
    │   └── UserMenu (React island, modified)
    └── ActivitiesPageContainer (React island)
        └── [existing activity components]

/profile (new)
└── AuthenticatedLayout
    ├── TopBar (React island)
    │   └── UserMenu (React island, modified)
    └── ProfileForm (React island)
```

---

### 1.7 Routing and Navigation

**Route Table:**

| Route | Auth Required | Layout | SSR | Purpose |
|-------|--------------|---------|-----|---------|
| `/` | No | None | Yes | Landing page, redirects based on auth |
| `/login` | No | UnauthenticatedLayout | Yes | User login |
| `/signup` | No | UnauthenticatedLayout | Yes | User registration |
| `/password-reset` | No | UnauthenticatedLayout | Yes | Password reset request |
| `/activities` | Yes | AuthenticatedLayout | Yes | Activity list (home) |
| `/profile` | Yes | AuthenticatedLayout | Yes | User profile settings |

**Navigation Flows:**

**New User Journey:**
```
/ → /login → [Click "Sign up"] → /signup → [Submit] → /activities
```

**Existing User Journey:**
```
/ → /login → [Submit] → /activities
```

**Logout Journey:**
```
/activities → [Click user menu] → [Click "Logout"] → /login
```

**Password Reset Journey:**
```
/login → [Click "Forgot password?"] → /password-reset → [Submit] → [Email] → [Supabase reset page] → /login
```

**Profile Management Journey:**
```
/activities → [Click user menu] → [Click "Profile"] → /profile → [Submit] → /activities
```

---

### 1.8 Error Handling and User Feedback

**Error Display Patterns:**

**Form-Level Errors:**
- Display in error banner at top of form
- Red background, white text
- Dismissible with X button
- Examples:
  - "Invalid credentials"
  - "Email already exists"
  - "Failed to send reset email"

**Field-Level Errors:**
- Display below input field
- Small red text
- Associated with input via aria-describedby
- Examples:
  - "Email is required"
  - "Password is too weak"
  - "Passwords do not match"

**Success Messages:**
- Display in success banner
- Green background, white text
- Auto-dismiss after 3 seconds
- Examples:
  - "Profile updated successfully"
  - "Reset link sent to your email"

**Loading States:**
- Button shows spinner and "Loading..." text
- Form inputs disabled during submission
- Prevents double submission

---

### 1.9 Responsive Design Considerations

**Mobile (< 768px):**
- Full-width forms
- Larger touch targets (min 44x44px)
- Simplified navigation
- Stack form elements vertically

**Desktop (>= 768px):**
- Max-width containers (max-w-md for forms)
- Centered layouts
- Hover states on interactive elements
- Side-by-side layouts where appropriate

**Accessibility:**
- Keyboard navigation throughout
- Screen reader support (ARIA labels, live regions)
- High contrast text (WCAG AA: 4.5:1)
- Focus indicators visible
- Skip links for keyboard users

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints to Create

#### 2.1.1 `POST /api/auth/signup` - User Registration (NEW)

**File Location:** `src/pages/api/auth/signup.ts`

**Purpose:** Create new user account via Supabase Auth and initialize profile.

**Request Schema:**
```typescript
interface SignupRequestBody {
  email: string;
  password: string;
}
```

**Validation (Zod Schema):**
```typescript
const signupCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/\d/, 'Password must contain number'),
});
```

**Implementation Flow:**
```typescript
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Validate Content-Type
  const contentType = context.request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }

  // 2. Parse JSON body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return badRequest('Invalid JSON');
  }

  // 3. Validate with Zod
  const result = signupCommandSchema.safeParse(requestBody);
  if (!result.success) {
    return badRequest('Invalid input', {
      validationErrors: result.error.errors
    });
  }

  const { email, password } = result.data;

  // 4. Call Supabase Auth signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // Handle specific errors
    if (error.message.includes('already registered')) {
      return new Response(
        JSON.stringify({
          error: { message: 'Email already exists' }
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('[Signup] Supabase error:', error);
    return internalServerError('signup_error');
  }

  if (!data.user) {
    return internalServerError('signup_no_user');
  }

  // 5. Create user profile (with default preferences)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: data.user.id,
      distance_unit: 'km', // default
    });

  if (profileError) {
    console.error('[Signup] Profile creation error:', profileError);
    // User created but profile failed - log for manual fix
    // Don't fail the signup though
  }

  // 6. Return success response
  const response: AuthSignupResponseDto = {
    userId: data.user.id,
    email: data.user.email!,
  };

  return new Response(
    JSON.stringify(response),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Response Codes:**
- 201: Success (user created)
- 400: Bad request (invalid input)
- 409: Conflict (email already exists)
- 500: Internal server error

**Security Considerations:**
- Password hashing handled by Supabase
- Email uniqueness enforced by Supabase
- No password in logs or error messages
- Rate limiting (via middleware)

---

#### 2.1.2 `POST /api/auth/login` - User Login (NEW)

**File Location:** `src/pages/api/auth/login.ts`

**Purpose:** Authenticate user and create session.

**Request Schema:**
```typescript
interface LoginRequestBody {
  email: string;
  password: string;
}
```

**Validation (Zod Schema):**
```typescript
const loginCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
```

**Implementation Flow:**
```typescript
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Validate Content-Type
  const contentType = context.request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }

  // 2. Parse JSON body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return badRequest('Invalid JSON');
  }

  // 3. Validate with Zod
  const result = loginCommandSchema.safeParse(requestBody);
  if (!result.success) {
    return badRequest('Invalid input', {
      validationErrors: result.error.errors
    });
  }

  const { email, password } = result.data;

  // 4. Call Supabase Auth signIn
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Generic error message for security (prevents user enumeration)
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid credentials' }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!data.user || !data.session) {
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid credentials' }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Set session cookie (handled automatically by Supabase client)
  // The session token is stored in an HTTPOnly cookie

  // 6. Return success response
  const response: AuthLoginResponseDto = {
    userId: data.user.id,
    email: data.user.email!,
  };

  return new Response(
    JSON.stringify(response),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**Response Codes:**
- 200: Success (authenticated)
- 400: Bad request (invalid input)
- 401: Unauthorized (invalid credentials)
- 500: Internal server error

**Security Considerations:**
- Generic error message (prevents user enumeration)
- HTTPOnly cookie for session storage
- No password in logs
- Rate limiting (via middleware)

---

#### 2.1.3 `POST /api/auth/logout` - User Logout (NEW)

**File Location:** `src/pages/api/auth/logout.ts`

**Purpose:** Invalidate user session and clear cookies.

**Request Schema:** None (no body)

**Implementation Flow:**
```typescript
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Call Supabase Auth signOut
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[Logout] Error:', error);
    // Still return success (client will handle)
  }

  // 2. Clear session cookie (handled automatically by Supabase)

  // 3. Return success (no content)
  return new Response(null, { status: 204 });
}
```

**Response Codes:**
- 204: Success (no content)
- 500: Internal server error (rare, not critical)

**Security Considerations:**
- Idempotent (can be called multiple times)
- Always clears client-side session
- No sensitive data in response

---

#### 2.1.4 `POST /api/auth/password-reset` - Password Reset Request (NEW)

**File Location:** `src/pages/api/auth/password-reset.ts`

**Purpose:** Initiate password reset flow (sends email via Supabase).

**Request Schema:**
```typescript
interface PasswordResetRequestBody {
  email: string;
}
```

**Validation (Zod Schema):**
```typescript
const passwordResetCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

**Implementation Flow:**
```typescript
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Validate Content-Type
  const contentType = context.request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }

  // 2. Parse JSON body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return badRequest('Invalid JSON');
  }

  // 3. Validate with Zod
  const result = passwordResetCommandSchema.safeParse(requestBody);
  if (!result.success) {
    return badRequest('Invalid input', {
      validationErrors: result.error.errors
    });
  }

  const { email } = result.data;

  // 4. Call Supabase Auth resetPasswordForEmail
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${context.url.origin}/login`,
  });

  if (error) {
    console.error('[Password Reset] Error:', error);
    // Don't reveal if email exists - always return 202
  }

  // 5. Always return success (security: don't reveal if email exists)
  return new Response(null, { status: 202 });
}
```

**Response Codes:**
- 202: Accepted (always, regardless of email existence)
- 400: Bad request (invalid input)
- 500: Internal server error

**Security Considerations:**
- Always returns 202 (prevents user enumeration)
- Email sent by Supabase (time-limited token)
- Rate limiting critical (prevent spam)
- Redirect URL validated by Supabase

---

#### 2.1.5 `GET /api/profile` - Get User Profile (NEW)

**File Location:** `src/pages/api/profile.ts`

**Purpose:** Fetch authenticated user's profile.

**Request Schema:** None (uses session)

**Implementation Flow:**
```typescript
export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Get authenticated user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: { message: 'Not authenticated' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    // Profile doesn't exist - create it with defaults
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, distance_unit: 'km' })
      .select()
      .single();

    if (createError) {
      console.error('[Profile GET] Create error:', createError);
      return internalServerError('profile_create_error');
    }

    const response: ProfileDto = {
      userId: newProfile.user_id,
      distanceUnit: newProfile.distance_unit as DistanceUnit,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Map to DTO
  const response: ProfileDto = {
    userId: profile.user_id,
    distanceUnit: profile.distance_unit as DistanceUnit,
  };

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Response Codes:**
- 200: Success
- 401: Unauthorized (not authenticated)
- 500: Internal server error

---

#### 2.1.6 `PATCH /api/profile` - Update User Profile (NEW)

**File Location:** `src/pages/api/profile.ts` (add to existing file)

**Purpose:** Update authenticated user's profile preferences.

**Request Schema:**
```typescript
interface ProfilePatchRequestBody {
  distanceUnit: 'km' | 'mi';
}
```

**Validation (Zod Schema):**
```typescript
const profilePatchCommandSchema = z.object({
  distanceUnit: z.enum(['km', 'mi'], {
    errorMap: () => ({ message: 'distanceUnit must be km or mi' }),
  }),
});
```

**Implementation Flow:**
```typescript
export async function PATCH(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: { message: 'Not authenticated' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Validate Content-Type
  const contentType = context.request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }

  // 3. Parse JSON body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return badRequest('Invalid JSON');
  }

  // 4. Validate with Zod
  const result = profilePatchCommandSchema.safeParse(requestBody);
  if (!result.success) {
    return badRequest('Invalid input', {
      validationErrors: result.error.errors
    });
  }

  const { distanceUnit } = result.data;

  // 5. Update profile in database
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ distance_unit: distanceUnit })
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('[Profile PATCH] Update error:', updateError);
    return internalServerError('profile_update_error');
  }

  // 6. Map to DTO
  const response: ProfileDto = {
    userId: updatedProfile.user_id,
    distanceUnit: updatedProfile.distance_unit as DistanceUnit,
  };

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Response Codes:**
- 200: Success
- 400: Bad request (invalid input)
- 401: Unauthorized (not authenticated)
- 500: Internal server error

---

### 2.2 Middleware Updates

#### 2.2.1 Authentication Middleware (MODIFY)

**File Location:** `src/middleware/index.ts`

**Current Behavior:** Only injects Supabase client

**New Behavior:**
- Inject Supabase client
- Check authentication for protected routes
- Redirect unauthenticated users to login
- Set authenticated user in context.locals

**Modified Implementation:**
```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // Inject Supabase client into context
  context.locals.supabase = supabase;

  // Define public paths (no auth required)
  const publicPaths = ['/login', '/signup', '/password-reset', '/api/auth/signup', '/api/auth/login', '/api/auth/password-reset'];

  const isPublicPath = publicPaths.some(path =>
    context.url.pathname === path || context.url.pathname.startsWith(path)
  );

  // Allow public paths without authentication check
  if (isPublicPath) {
    return next();
  }

  // For all other paths, check authentication
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Not authenticated - redirect to login with return URL
    const returnTo = context.url.pathname + context.url.search;
    return context.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // Store user in context for pages to use
  context.locals.user = session.user;

  return next();
});
```

**Key Changes:**
- Use `@supabase/ssr` package for proper SSR cookie handling
- Implement authentication checks for protected routes
- Redirect unauthenticated users to login
- Preserve return URL for post-login redirect
- Store authenticated user in context.locals

---

### 2.3 Type Definitions Updates

#### 2.3.1 Update Astro.locals Type (MODIFY)

**File Location:** `src/env.d.ts`

**Add User to Locals:**
```typescript
declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user?: import('@supabase/supabase-js').User; // Add this
  }
}
```

---

### 2.4 Validation Schemas

**File Location:** `src/lib/validators.ts` (add to existing)

**Add Authentication Validation Schemas:**
```typescript
/**
 * Zod schema for signup command validation
 */
export const signupCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

/**
 * Zod schema for login command validation
 */
export const loginCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Zod schema for password reset command validation
 */
export const passwordResetCommandSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Zod schema for profile patch command validation
 */
export const profilePatchCommandSchema = z.object({
  distanceUnit: z.enum(['km', 'mi'], {
    errorMap: () => ({ message: 'distanceUnit must be km or mi' }),
  }),
});
```

---

### 2.5 Error Handling

**Common Error Response Format:**
```typescript
interface ErrorResponse {
  error: {
    message: string;
    correlationId?: string;
    details?: unknown;
  };
}
```

**Error Helper Functions (use existing from `src/lib/api/errors.ts`):**
- `badRequest(message, details?)` → 400
- `unauthorized(message)` → 401
- `forbidden(message)` → 403
- `notFound(message)` → 404
- `conflict(message)` → 409
- `unprocessableEntity(message, details?)` → 422
- `internalServerError(correlationId)` → 500

**Logging:**
- Log all server errors with correlation IDs
- Never log passwords or sensitive data
- Log authentication failures (for security monitoring)
- Log rate limiting violations

---

### 2.6 Astro Config Updates

**File Location:** `astro.config.mjs`

**Current Config:**
```javascript
export default defineConfig({
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  output: "server",
  adapter: node({ mode: "standalone" }),
});
```

**Verify:** Already configured for SSR (output: "server") - no changes needed.

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

**Package:** `@supabase/supabase-js` (existing) + `@supabase/ssr` (new)

**Installation:**
```bash
npm install @supabase/ssr
```

**Purpose:** `@supabase/ssr` provides proper cookie handling for SSR environments (Astro).

---

### 3.2 Session Management

**Session Storage:** HTTPOnly cookies (managed by Supabase)

**Cookie Configuration:**
```typescript
{
  httpOnly: true,       // Prevents XSS attacks
  secure: true,         // HTTPS only (production)
  sameSite: 'lax',      // CSRF protection
  path: '/',            // Available site-wide
  maxAge: 3600 * 24 * 7 // 7 days
}
```

**Session Lifetime:**
- Access token: 1 hour (configurable in Supabase dashboard)
- Refresh token: 7 days (configurable)
- Auto-refresh handled by Supabase client

**Session Refresh Strategy:**
```typescript
// In middleware or page
const { data: { session }, error } = await supabase.auth.getSession();

if (error || !session) {
  // Attempt to refresh
  const { data: { session: newSession }, error: refreshError } =
    await supabase.auth.refreshSession();

  if (refreshError || !newSession) {
    // Refresh failed - redirect to login
    return context.redirect('/login');
  }

  // Continue with new session
}
```

---

### 3.3 Authentication Flow Details

#### 3.3.1 Registration Flow

```
1. User fills signup form on /signup
   ├─ Client-side validation (email format, password strength)
   └─ Submit to POST /api/auth/signup

2. Server receives request
   ├─ Validate Content-Type and JSON
   ├─ Validate with Zod schema
   └─ Call supabase.auth.signUp({ email, password })

3. Supabase creates user
   ├─ Hashes password (bcrypt)
   ├─ Creates entry in auth.users table
   └─ Returns user object and session

4. Server creates profile
   ├─ Insert into profiles table (user_id, distance_unit: 'km')
   └─ Handle profile creation errors gracefully

5. Server returns success
   ├─ Session cookie set automatically by Supabase
   └─ Return 201 with user data

6. Client redirects to /activities
   └─ User is now authenticated
```

**Edge Cases:**
- Email already exists → 409 Conflict
- Weak password → 400 Bad Request
- Profile creation fails → Log error, don't fail signup
- Network error → 500 Internal Server Error

---

#### 3.3.2 Login Flow

```
1. User fills login form on /login
   ├─ Client-side validation (email format, non-empty password)
   └─ Submit to POST /api/auth/login

2. Server receives request
   ├─ Validate Content-Type and JSON
   ├─ Validate with Zod schema
   └─ Call supabase.auth.signInWithPassword({ email, password })

3. Supabase authenticates user
   ├─ Verifies email exists
   ├─ Verifies password hash
   └─ Returns user object and session

4. Server returns success
   ├─ Session cookie set automatically by Supabase
   └─ Return 200 with user data

5. Client redirects to returnTo or /activities
   └─ User is now authenticated
```

**Edge Cases:**
- Invalid credentials → 401 Unauthorized (generic message)
- Account not found → 401 Unauthorized (generic message)
- Too many attempts → 429 Too Many Requests (rate limiting)
- Network error → 500 Internal Server Error

---

#### 3.3.3 Logout Flow

```
1. User clicks Logout in UserMenu
   └─ Submit to POST /api/auth/logout

2. Server receives request
   └─ Call supabase.auth.signOut()

3. Supabase invalidates session
   ├─ Revokes refresh token
   └─ Clears session cookie

4. Server returns success
   └─ Return 204 No Content

5. Client redirects to /login
   └─ User is now logged out
```

**Edge Cases:**
- Already logged out → Still return 204 (idempotent)
- Network error → Client still redirects to /login

---

#### 3.3.4 Password Reset Flow

```
1. User clicks "Forgot password?" on /login
   └─ Navigate to /password-reset

2. User fills email form
   └─ Submit to POST /api/auth/password-reset

3. Server receives request
   ├─ Validate email format
   └─ Call supabase.auth.resetPasswordForEmail(email)

4. Supabase sends email
   ├─ Generate time-limited reset token (1 hour)
   ├─ Send email with reset link
   └─ Link format: https://supabase-project.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=/login

5. Server returns success
   └─ Return 202 Accepted (always, regardless of email existence)

6. User receives email
   └─ Clicks reset link

7. Supabase handles reset
   ├─ Verifies token validity
   ├─ Shows password reset form
   └─ User enters new password

8. Supabase updates password
   ├─ Hashes new password
   ├─ Updates auth.users table
   └─ Redirects to /login

9. User logs in with new password
   └─ Normal login flow
```

**Edge Cases:**
- Email doesn't exist → Still return 202 (security)
- Token expired → Supabase shows error, user requests new reset
- Invalid token → Supabase shows error
- Too many requests → 429 Too Many Requests (rate limiting)

---

### 3.4 Row Level Security (RLS) Integration

**Current RLS Policies (already in place):**

**Profiles Table:**
```sql
-- Users can only access their own profile
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_profile_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_profile_delete" ON profiles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

**Activities Table:**
```sql
-- Users can only access their own activities
CREATE POLICY "own_activity_select" ON activities
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "own_activity_insert" ON activities
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_activity_update" ON activities
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_activity_delete" ON activities
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

**How RLS Works with Auth:**
1. User authenticates via Supabase Auth
2. Session JWT contains `user_id`
3. Supabase client sends JWT with all requests
4. PostgreSQL extracts `user_id` from JWT via `auth.uid()`
5. RLS policies filter queries to only user's data
6. Application code doesn't need to add `WHERE user_id = ...` (automatic)

**Important:** Never use service role key in production (bypasses RLS). Always use anon key with user session.

---

### 3.5 Client Configuration Changes

**Current Configuration (MODIFY):**

**File:** `src/db/supabase.client.ts`

**Current Implementation:**
```typescript
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
```

**Problem:** Single global client doesn't work with SSR (no per-request session)

**New Implementation:**

**Remove global client, create per-request client in middleware:**

```typescript
// src/db/supabase.client.ts (modify)
import type { Database } from "./database.types";

// Export types only, no global client
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

// Remove DEFAULT_USER_ID (no longer needed after auth implementation)
```

**Middleware creates per-request client (already shown in section 2.2.1)**

---

### 3.6 Environment Variables

**Required Variables:**

**.env (add if missing):**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key # Public anon key (safe for client-side)

# DO NOT USE IN PRODUCTION (only for local development)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:**
- `SUPABASE_KEY` is the **anon key** (public, safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` **must not** be used in production (bypasses RLS)
- For local development with RLS disabled, service role key can be used
- For production, always use anon key with user sessions

**.env.example (update):**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# OpenRouter Configuration (existing)
OPENROUTER_API_KEY=###
```

---

## 4. COMPONENT CONTRACTS

### 4.1 React Component Props Interfaces

#### LoginForm
```typescript
interface LoginFormProps {
  returnTo?: string;
}
```

#### SignupForm
```typescript
interface SignupFormProps {
  // No props - redirects to /activities on success
}
```

#### PasswordStrengthIndicator
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string[];
}
```

#### PasswordResetForm
```typescript
interface PasswordResetFormProps {
  // No props
}
```

#### ProfileForm
```typescript
interface ProfileFormProps {
  initialDistanceUnit: 'km' | 'mi';
  userEmail: string;
}
```

#### UserMenu (modified)
```typescript
interface UserMenuProps {
  user: {
    email: string;
  };
}
```

---

### 4.2 API Request/Response Contracts

#### POST /api/auth/signup

**Request:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, uppercase, lowercase, number
}
```

**Response (201):**
```typescript
{
  userId: string;     // UUID
  email: string;
}
```

**Errors:**
- 400: Invalid input (validation errors)
- 409: Email already exists
- 500: Internal server error

---

#### POST /api/auth/login

**Request:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Non-empty
}
```

**Response (200):**
```typescript
{
  userId: string;     // UUID
  email: string;
}
```

**Errors:**
- 400: Invalid input
- 401: Invalid credentials (generic message)
- 500: Internal server error

---

#### POST /api/auth/logout

**Request:** None (empty body)

**Response (204):** No content

**Errors:**
- 500: Internal server error (rare)

---

#### POST /api/auth/password-reset

**Request:**
```typescript
{
  email: string;      // Valid email format
}
```

**Response (202):** No content (always, regardless of email existence)

**Errors:**
- 400: Invalid input
- 500: Internal server error

---

#### GET /api/profile

**Request:** None (uses session)

**Response (200):**
```typescript
{
  userId: string;           // UUID
  distanceUnit: 'km' | 'mi';
}
```

**Errors:**
- 401: Not authenticated
- 500: Internal server error

---

#### PATCH /api/profile

**Request:**
```typescript
{
  distanceUnit: 'km' | 'mi';
}
```

**Response (200):**
```typescript
{
  userId: string;           // UUID
  distanceUnit: 'km' | 'mi';
}
```

**Errors:**
- 400: Invalid input
- 401: Not authenticated
- 500: Internal server error

---

### 4.3 Database Schema (No Changes)

**Existing schema already supports authentication:**

**auth.users (Supabase managed):**
- Contains user credentials and auth metadata
- Created automatically by Supabase Auth

**profiles table:**
- Links to auth.users via user_id (FK)
- Stores distance_unit preference
- RLS policies already in place

**activities table:**
- Links to profiles via user_id (FK)
- RLS policies already in place

**No database migrations needed** - existing schema is auth-ready!

---

## 5. DATA FLOW DIAGRAMS

### 5.1 Registration Flow

```
┌─────────────┐
│   Browser   │
│  /signup    │
└──────┬──────┘
       │ 1. User fills form (email, password, confirm password)
       │ 2. Client validates (email format, password strength, match)
       │ 3. POST /api/auth/signup
       ▼
┌─────────────────────────────────────────────────────┐
│  Astro Server - src/pages/api/auth/signup.ts       │
│  ─────────────────────────────────────────────────  │
│  1. Validate Content-Type: application/json         │
│  2. Parse JSON body                                 │
│  3. Validate with Zod schema (signupCommandSchema)  │
│  4. Call supabase.auth.signUp({ email, password }) │
│     ├─ Supabase hashes password                     │
│     ├─ Creates entry in auth.users                  │
│     ├─ Generates JWT session                        │
│     └─ Sets HTTPOnly cookie                         │
│  5. Create profile: INSERT INTO profiles            │
│     └─ { user_id, distance_unit: 'km' }            │
│  6. Return 201 with { userId, email }              │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Supabase Auth + DB    │
│  ─────────────────────  │
│  auth.users             │
│  └─ id (UUID)           │
│  └─ email               │
│  └─ encrypted_password  │
│  └─ created_at          │
│                         │
│  profiles               │
│  └─ user_id (FK)        │
│  └─ distance_unit       │
└─────────────────────────┘
           │
           │ 7. Session cookie set
           ▼
┌─────────────┐
│   Browser   │
│  redirects  │
│  /activities│
└─────────────┘
```

---

### 5.2 Login Flow

```
┌─────────────┐
│   Browser   │
│   /login    │
└──────┬──────┘
       │ 1. User fills form (email, password)
       │ 2. Client validates (email format, non-empty password)
       │ 3. POST /api/auth/login
       ▼
┌──────────────────────────────────────────────────────────┐
│  Astro Server - src/pages/api/auth/login.ts             │
│  ──────────────────────────────────────────────────────  │
│  1. Validate Content-Type and JSON                       │
│  2. Validate with Zod schema (loginCommandSchema)        │
│  3. Call supabase.auth.signInWithPassword({ email, ... })│
│     ├─ Supabase verifies email exists                    │
│     ├─ Verifies password hash                            │
│     ├─ Generates JWT session                             │
│     └─ Sets HTTPOnly cookie                              │
│  4. Return 200 with { userId, email }                    │
│     OR Return 401 with generic error                     │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Supabase Auth         │
│  ─────────────────────  │
│  Validates credentials  │
│  Creates session        │
│  Returns JWT token      │
└─────────────────────────┘
           │
           │ 5. Session cookie set
           ▼
┌─────────────┐
│   Browser   │
│  redirects  │
│  /activities│
└─────────────┘
```

---

### 5.3 Protected Page Access Flow

```
┌─────────────┐
│   Browser   │
│  GET /activities
└──────┬──────┘
       │ 1. Request with session cookie
       ▼
┌────────────────────────────────────────────────────────┐
│  Astro Middleware - src/middleware/index.ts           │
│  ────────────────────────────────────────────────────  │
│  1. Create Supabase client with cookie handler         │
│  2. Check if path is public (/login, /signup, etc.)   │
│     └─ If public: skip to next()                       │
│  3. If protected: Call supabase.auth.getSession()      │
│     ├─ Extract JWT from cookie                         │
│     ├─ Verify JWT signature and expiry                 │
│     └─ Return session or null                          │
│  4. If no session: Redirect to /login?returnTo=...     │
│  5. If session valid:                                  │
│     ├─ Store user in context.locals.user               │
│     └─ Continue to next()                              │
└──────────┬─────────────────────────────────────────────┘
           │
           │ 6. Authenticated
           ▼
┌────────────────────────────────────────────────────────┐
│  Astro Page - src/pages/activities.astro              │
│  ────────────────────────────────────────────────────  │
│  1. Access user from context.locals.user               │
│  2. Fetch user profile from DB                         │
│  3. Fetch activities with RLS filtering:               │
│     SELECT * FROM activities                           │
│     WHERE user_id = auth.uid()  (automatic via RLS)    │
│  4. Render page with user data                         │
└────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────┐
│   Browser   │
│  displays   │
│  activities │
└─────────────┘
```

---

### 5.4 Session Refresh Flow

```
┌─────────────┐
│   Browser   │
│  requests page
└──────┬──────┘
       │ 1. Request with session cookie (expired access token)
       ▼
┌────────────────────────────────────────────────────────┐
│  Astro Middleware                                      │
│  ────────────────────────────────────────────────────  │
│  1. Call supabase.auth.getSession()                    │
│     └─ Returns null (access token expired)             │
│  2. Attempt refresh: supabase.auth.refreshSession()    │
│     ├─ Supabase validates refresh token                │
│     ├─ Generates new access token                      │
│     ├─ Updates session cookie                          │
│     └─ Returns new session                             │
│  3. If refresh successful:                             │
│     └─ Continue with new session                       │
│  4. If refresh fails:                                  │
│     └─ Redirect to /login                              │
└────────────────────────────────────────────────────────┘
```

---

### 5.5 API Request Authentication

```
┌─────────────┐
│   Browser   │
│  React Component
└──────┬──────┘
       │ 1. API request (e.g., POST /api/activities)
       │ 2. Includes session cookie automatically
       ▼
┌────────────────────────────────────────────────────────┐
│  Astro API Route - src/pages/api/activities.ts        │
│  ────────────────────────────────────────────────────  │
│  1. Get Supabase client from context.locals.supabase   │
│  2. Call supabase.auth.getUser()                       │
│     ├─ Extracts JWT from cookie                        │
│     ├─ Validates JWT                                   │
│     └─ Returns user object                             │
│  3. If no user: Return 401 Unauthorized                │
│  4. If user valid:                                     │
│     ├─ Use user.id for database operations             │
│     ├─ RLS automatically filters to user's data        │
│     └─ Process request                                 │
└────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   PostgreSQL + RLS      │
│  ─────────────────────  │
│  Every query filtered   │
│  WHERE user_id =        │
│    auth.uid()           │
│  (automatic)            │
└─────────────────────────┘
```

---

## 6. SECURITY CONSIDERATIONS

### 6.1 Authentication Security

**Password Security:**
- Minimum 8 characters, uppercase, lowercase, number required
- Hashed with bcrypt (handled by Supabase)
- Never logged or exposed in error messages
- No password strength meter on login (prevents user enumeration)

**Session Security:**
- HTTPOnly cookies (prevents XSS attacks)
- Secure flag (HTTPS only in production)
- SameSite=Lax (CSRF protection)
- JWT tokens signed and verified by Supabase
- Refresh tokens rotated on use

**Rate Limiting:**
- Login attempts: 5 per minute per IP (implement in middleware)
- Signup attempts: 3 per hour per IP
- Password reset: 3 per hour per email
- API requests: 60 per minute per user

**Generic Error Messages:**
- Login failure: "Invalid credentials" (no "user not found" vs "wrong password")
- Password reset: Always "email sent" (even if email doesn't exist)
- Prevents user enumeration attacks

---

### 6.2 Data Protection

**Row Level Security (RLS):**
- Enabled on all tables (profiles, activities)
- Users can only access their own data
- Enforced at database level (can't be bypassed from app)
- Uses auth.uid() from JWT token

**HTTPS Enforcement:**
- All traffic over HTTPS in production
- Configured at hosting/proxy level (DigitalOcean)
- Redirect HTTP to HTTPS
- HSTS header enabled

**Data Minimization (GDPR):**
- Only collect necessary data (email, hashed password, activity data)
- No tracking cookies
- No third-party analytics (unless explicitly added)
- User can delete account (cascades to all data)

---

### 6.3 XSS Prevention

**Input Sanitization:**
- All user input validated with Zod schemas
- React automatically escapes HTML
- No `dangerouslySetInnerHTML` used
- Content-Type validation on all API endpoints

**Output Encoding:**
- React JSX escapes output by default
- API responses always application/json
- No inline JavaScript in HTML

---

### 6.4 CSRF Prevention

**SameSite Cookies:**
- Session cookies use SameSite=Lax
- Prevents CSRF attacks from external sites
- Allows navigation from external sites (e.g., password reset email)

**State Verification:**
- Critical actions (delete, profile update) require confirmation
- Forms include validation tokens (handled by Supabase)

---

### 6.5 SQL Injection Prevention

**Parameterized Queries:**
- Supabase client uses parameterized queries automatically
- No raw SQL concatenation in application code
- RLS provides additional protection

---

### 6.6 Secrets Management

**Environment Variables:**
- Sensitive keys in .env (not committed to git)
- .env.example provides template
- Never use service role key in production

**Key Rotation:**
- Supabase anon key can be rotated in dashboard
- JWT secret rotated via Supabase settings
- Document rotation procedure for team

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Dependencies & Types)

- [ ] Install `@supabase/ssr` package
- [ ] Update `src/env.d.ts` to add `user` to Locals interface
- [ ] Add auth validation schemas to `src/lib/validators.ts`
- [ ] Update `src/types.ts` (already has auth types, verify completeness)
- [ ] Remove `DEFAULT_USER_ID` from `src/db/supabase.client.ts`

### Phase 2: Middleware & Authentication

- [ ] Modify `src/middleware/index.ts` to use `@supabase/ssr` and implement auth checks
- [ ] Test middleware redirects for protected routes
- [ ] Test middleware allows public routes

### Phase 3: API Endpoints

- [ ] Create `src/pages/api/auth/signup.ts` (POST)
- [ ] Create `src/pages/api/auth/login.ts` (POST)
- [ ] Create `src/pages/api/auth/logout.ts` (POST)
- [ ] Create `src/pages/api/auth/password-reset.ts` (POST)
- [ ] Create `src/pages/api/profile.ts` (GET, PATCH)
- [ ] Test all API endpoints with Postman/curl
- [ ] Verify error handling and validation

### Phase 4: React Components

- [ ] Create `src/components/LoginForm.tsx`
- [ ] Create `src/components/SignupForm.tsx`
- [ ] Create `src/components/PasswordStrengthIndicator.tsx`
- [ ] Create `src/components/PasswordResetForm.tsx`
- [ ] Create `src/components/ProfileForm.tsx`
- [ ] Modify `src/components/UserMenu.tsx` (add Profile link, implement logout)
- [ ] Test all components in isolation

### Phase 5: Layouts

- [ ] Create `src/layouts/UnauthenticatedLayout.astro`
- [ ] Test layout renders correctly

### Phase 6: Pages

- [ ] Create `src/pages/login.astro`
- [ ] Create `src/pages/signup.astro`
- [ ] Create `src/pages/password-reset.astro`
- [ ] Create `src/pages/profile.astro`
- [ ] Modify `src/pages/index.astro` (redirect based on auth)
- [ ] Modify `src/pages/activities.astro` (use real user, remove DEFAULT_USER_ID)
- [ ] Test all pages render and function correctly

### Phase 7: Integration Testing

- [ ] Test complete registration flow
- [ ] Test complete login flow
- [ ] Test logout flow
- [ ] Test password reset flow (requires email setup in Supabase)
- [ ] Test profile update flow
- [ ] Test authenticated page access
- [ ] Test unauthenticated redirect
- [ ] Test session expiry and refresh
- [ ] Test RLS policies (users can only see own data)

### Phase 8: Security Audit

- [ ] Verify all API endpoints validate input
- [ ] Verify generic error messages (no user enumeration)
- [ ] Verify HTTPOnly cookies set correctly
- [ ] Verify HTTPS enforced in production
- [ ] Verify rate limiting implemented
- [ ] Verify no passwords in logs
- [ ] Verify XSS prevention (React escaping, no dangerouslySetInnerHTML)
- [ ] Verify CSRF prevention (SameSite cookies)
- [ ] Verify SQL injection prevention (parameterized queries)

### Phase 9: User Experience

- [ ] Verify loading states on all forms
- [ ] Verify error messages clear and helpful
- [ ] Verify success messages displayed
- [ ] Verify keyboard navigation works
- [ ] Verify screen reader accessibility
- [ ] Verify mobile responsive design
- [ ] Verify autofocus on first input
- [ ] Verify password visibility toggle (optional)

### Phase 10: Documentation & Deployment

- [ ] Update README.md with auth setup instructions
- [ ] Document environment variables
- [ ] Document Supabase configuration steps
- [ ] Test production build (`npm run build`)
- [ ] Test production deployment on DigitalOcean
- [ ] Verify HTTPS works in production
- [ ] Monitor logs for errors
- [ ] Document known issues and edge cases

---

## Summary

This specification provides a complete authentication system architecture for AstroRunner, implementing:

**User Interface:**
- 3 new unauthenticated pages (login, signup, password reset)
- 1 new authenticated page (profile)
- 6 new React components (forms and indicators)
- 1 new layout (UnauthenticatedLayout)
- Modifications to existing pages and components

**Backend:**
- 5 new API endpoints (signup, login, logout, password reset, profile)
- Enhanced middleware with authentication checks
- Validation schemas for all auth operations
- Proper error handling and logging

**Authentication System:**
- Supabase Auth integration with SSR support
- HTTPOnly cookie-based session management
- Row Level Security for data protection
- Password strength validation
- Generic error messages for security
- Rate limiting and HTTPS enforcement

**Key Design Decisions:**
- Use `@supabase/ssr` for proper SSR cookie handling (not global client)
- Middleware handles all authentication checks (DRY principle)
- RLS enforces data access at database level (defense in depth)
- Generic error messages prevent user enumeration
- Optimistic UI with proper error handling
- Mobile-first responsive design

**Implementation Timeline Estimate:**
- Phase 1-2 (Foundation & Middleware): 4 hours
- Phase 3 (API Endpoints): 6 hours
- Phase 4-5 (Components & Layouts): 8 hours
- Phase 6 (Pages): 6 hours
- Phase 7-9 (Testing & UX): 8 hours
- Phase 10 (Documentation): 2 hours
- **Total: ~34 hours of development time**

This specification is ready for implementation and covers all requirements from the PRD while maintaining compatibility with the existing application architecture.
