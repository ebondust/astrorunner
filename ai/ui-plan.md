# UI Architecture for Activity Logger

## 1. UI Structure Overview

The Activity Logger is built using Astro 5's Multi-Page Application (MPA) architecture with React 19 islands for interactive components. The application follows a desktop-first responsive design approach, utilizing Tailwind 4 for styling and Shadcn/ui for accessible, pre-built components.

The UI is organized into two main hierarchical levels:

1. **Unauthenticated Pages**: Minimal layout for authentication flows (login, signup, password reset)
2. **Authenticated Pages**: Full application layout with persistent topbar navigation and main content area

The architecture emphasizes simplicity and speed, with modal-based interactions for CRUD operations that keep users in context. Monthly pagination provides intuitive navigation through historical activity data, while inline error handling and optimistic UI updates ensure a responsive user experience.

**Key Architectural Principles:**
- Server-rendered pages with client-side React islands for interactivity
- State management via React hooks and Context API (no external state libraries)
- Monthly data fetching with date range filtering
- Inline validation and error display
- Sticky navigation elements for consistent access
- WCAG AA accessibility compliance
- JWT-based authentication with Supabase backend
- GDPR/RODO compliant data handling

## 2. View List

### 2.1 Unauthenticated Views

#### `/login` - User Login Page

**Main Purpose:** Allow existing users to authenticate and access their activity data.

**Key Information to Display:**
- Email/username input field
- Password input field
- "Forgot password?" link
- "Create account" link to signup
- Login button (primary action)
- Error messages for failed authentication

**Key View Components:**
- `UnauthenticatedLayout` - Minimal wrapper with logo/branding
- `LoginForm` - Form component with email/password inputs
- `ErrorBanner` - Form-level error display
- `FieldError` - Inline validation error component

**UX Considerations:**
- Auto-focus on email field for immediate typing
- Enter key submits form
- Loading state on button ("Logging in...")
- Clear visual feedback during submission
- Fast redirect to /activities on success

**Accessibility Considerations:**
- Labels properly associated with inputs via `htmlFor`
- Error messages announced to screen readers via `aria-live`
- Keyboard navigable with visible focus indicators
- High contrast text (WCAG AA minimum 4.5:1)
- Password field supports password managers via autocomplete

**Security Considerations:**
- Generic error message ("Invalid credentials") prevents user enumeration
- HTTPS enforced for all authentication traffic
- Password field masked (type="password")
- No credential information in URL or logs
- Rate limiting applied server-side

---

#### `/signup` - User Registration Page

**Main Purpose:** Allow new users to create an account and start tracking activities.

**Key Information to Display:**
- Email input field (unique identifier)
- Password input field with strength indicator
- Confirm password input field
- Sign up button (primary action)
- "Already have an account?" link to login
- Field-level and form-level error messages
- Optional: Terms/Privacy acceptance checkbox

**Key View Components:**
- `UnauthenticatedLayout`
- `SignupForm` - Registration form with validation
- `PasswordStrengthIndicator` - Visual feedback for password quality
- `ErrorBanner` - Form-level errors
- `FieldError` - Inline field errors

**UX Considerations:**
- Real-time password validation (length, complexity)
- Confirm password matching validation
- Clear error messages for common issues (email exists, weak password)
- Auto-focus on first field
- Immediate redirect to /activities on success

**Accessibility Considerations:**
- Password requirements clearly stated in helper text
- Required fields marked with asterisk and `aria-required="true"`
- Error announcements via screen reader
- Keyboard accessible throughout

**Security Considerations:**
- Password strength validation (client and server)
- Email format validation
- HTTPS enforced
- Secure password hashing handled by Supabase
- No password displayed in plain text

---

#### `/password-reset` - Password Reset Request Page

**Main Purpose:** Allow users to initiate password reset process via email.

**Key Information to Display:**
- Email input field
- Instructional text: "Enter your email to receive a password reset link"
- Submit button (primary action)
- Success message after submission
- "Back to Login" link
- Error message for invalid input

**Key View Components:**
- `UnauthenticatedLayout`
- `PasswordResetForm` - Simple form with email input
- `SuccessMessage` - Confirmation after submission
- `ErrorMessage` - Error display

**UX Considerations:**
- Generic success message for security: "If an account exists, you'll receive a reset link"
- Clear instructions before form
- Loading state during submission
- Automatic email validation

**Accessibility Considerations:**
- Clear labels and instructions
- Success/error messages announced to screen readers
- Keyboard accessible

**Security Considerations:**
- Generic response regardless of email existence (prevents enumeration)
- Rate limiting on server side
- Time-limited reset tokens
- HTTPS enforced

---

### 2.2 Authenticated Views

#### `/activities` - Main Activity List View (Home/Default)

**Main Purpose:** Display user's activities for the selected month with ability to create, edit, and delete activities.

**Key Information to Display:**
- **Topbar Navigation:**
  - Logo/branding (left, links to /activities)
  - User menu (right: username, profile link, logout)

- **Month Navigation (sticky):**
  - Previous month button (← icon/text)
  - Current month/year display (clickable for picker)
  - Next month button (→ icon/text)
  - "Today" button (quick navigation to current month)

- **Add Activity Button:**
  - Primary button below month navigation

- **Activity List:**
  - Date headers for grouping (e.g., "Monday, Nov 4" or "Today")
  - Activity cards displaying:
    - Activity type badge (colored: Run=blue, Walk=green, Mixed=orange)
    - Date and optionally time
    - Duration (formatted: "1h 30m")
    - Distance (with user's preferred unit or "—")
    - Edit button
    - Delete button

- **Empty State:**
  - Icon/illustration
  - Message: "No activities in [Month Year]" or "Start tracking your activities"
  - Add Activity button

- **Loading State:**
  - 3-5 skeleton card loaders during data fetch

**Key View Components:**
- `AuthenticatedLayout` - Wrapper with topbar and context providers
- `TopBar` (React island) - Persistent navigation with logo and user menu
- `UserMenu` (React island) - Dropdown with username, profile link, logout
- `MonthNavigation` (React island, sticky) - Month selector controls
- `MonthYearPickerModal` - Modal for selecting any month/year
- `AddActivityButton` - Primary action button
- `ActivityList` (React island) - Container managing data fetching and state
- `DateHeader` - Date divider (sticky on scroll)
- `ActivityCard` - Individual activity display with actions
- `EmptyState` - Display when no activities in month
- `SkeletonLoader` - Loading placeholder (3-5 cards)
- `ActivityFormModal` - Modal for creating/editing activities
- `DeleteConfirmationModal` - Confirmation dialog for deletion

**UX Considerations:**
- Sticky month navigation remains accessible during scroll
- Optimistic updates: activities appear/update/disappear immediately, revert on error
- Date headers create clear visual organization
- "Today" button provides quick navigation to current month
- Activity type colors provide at-a-glance information
- Hover states on edit/delete buttons for discoverability
- Loading states prevent user confusion during async operations
- Empty state encourages first action with clear call-to-action
- Monthly pagination reduces cognitive load (one month at a time)

**Accessibility Considerations:**
- Semantic HTML: `<nav>`, `<main>`, `<article>` for activity cards
- Keyboard navigation through activity cards (Tab, Enter/Space on buttons)
- Focus management: modal focus trap, focus return on close
- Screen reader announcements for state changes (loading, success, error)
- Activity type colors meet WCAG AA contrast requirements (4.5:1)
- ARIA labels for icon-only buttons (e.g., "Edit activity", "Delete activity")
- Skip links for keyboard users to jump to main content
- Date headers use semantic heading structure

**Security Considerations:**
- All API calls include authentication token (JWT in httpOnly cookie)
- User can only view/modify their own activities (RLS enforced)
- No sensitive data in URLs or visible in browser tools
- Automatic session refresh on 401 responses
- Redirect to login with return URL if session invalid

---

#### `/profile` - User Profile and Settings Page

**Main Purpose:** Manage user preferences (distance unit) and account settings (change password).

**Key Information to Display:**
- **Topbar Navigation** (same as /activities)
- **Page Title:** "User Profile" or "Profile Settings"
- **Profile Form (centered card/panel):**
  - Username field (display or input, depending on requirements)
  - Email display (read-only, non-editable)
  - Distance unit preference selector:
    - Radio buttons: Kilometers (km) or Miles (mi)
  - Change Password button (secondary action)
  - Save Changes button (primary action)
  - Success/error message banner

**Key View Components:**
- `AuthenticatedLayout`
- `ProfileForm` (React island) - Form with user settings
- `UsernameInput` - Username display or editable field
- `EmailDisplay` - Read-only email text
- `DistanceUnitSelector` - Radio button group for km/mi
- `ChangePasswordButton` - Triggers Supabase password change flow
- `SaveButton` - Primary action to save preferences
- `MessageBanner` - Success/error feedback

**UX Considerations:**
- Clear indication that email is read-only (visual styling + label)
- Radio buttons for binary choice (km vs mi) - easy to understand
- Save button prominently displayed
- Success message on save, then redirect to /activities
- Distance unit changes immediately reflected in activity list
- Change password handled separately via secure Supabase flow
- Back navigation to /activities clear (via topbar or explicit link)

**Accessibility Considerations:**
- Form fields properly labeled with `<label>` elements
- Radio buttons keyboard accessible (arrow keys to switch)
- Read-only field clearly indicated via `aria-readonly` attribute
- Success/error messages announced to screen readers
- High contrast for all text and controls

**Security Considerations:**
- Email not editable (prevents account takeover)
- Password change through secure Supabase authentication flow
- Session required to access page (middleware enforcement)
- HTTPS enforced for all profile updates
- User preferences stored securely in database with RLS

---

### 2.3 Modal Interactions (Within Views)

#### Activity Form Modal (Create/Edit)

**Main Purpose:** Provide a focused interface for creating new activities or editing existing ones without leaving the activity list context.

**Key Information to Display:**
- **Modal Header:**
  - Title: "Add Activity" (create mode) or "Edit Activity" (edit mode)
  - Close button (X icon)

- **Modal Body (Form):**
  - Activity Type selector (required):
    - Segmented control or radio buttons: [ Run ] [ Walk ] [ Mixed ]
    - Inline error below if validation fails
  - Date picker (required):
    - Calendar component or native date input
    - Default value: today (create mode) or existing date (edit mode)
    - Inline error below if invalid
  - Duration input (required):
    - Format: HH:MM (e.g., "01:30")
    - Implementation: two number inputs (hours, minutes) or masked text input
    - Validation: duration > 0, minutes < 60
    - Inline error below if invalid
  - Distance input (optional):
    - Number input with unit suffix (km or mi from user profile)
    - Placeholder: "Leave empty if unknown"
    - Inline error below if invalid (e.g., negative value)
  - Form-level error banner (top of form, if general error)

- **Modal Footer:**
  - Cancel button (secondary, left-aligned)
  - Save button (primary, right-aligned)
    - Text: "Save Activity" or "Update Activity"
    - Loading state: "Saving..." with spinner, disabled

**Key View Components:**
- `ActivityFormModal` (Dialog from Shadcn/ui)
- `ActivityTypeSelector` - Segmented control with three options
- `DatePicker` (Shadcn/ui Calendar component)
- `DurationInput` - Custom component with HH:MM validation
- `DistanceInput` - Number input with unit label
- `CancelButton`
- `SaveButton` - With loading state
- `ErrorDisplay` - Inline per field, banner for form-level errors

**UX Considerations:**
- Modal traps focus within itself (keyboard users can't tab outside)
- Escape key closes modal (optionally warn if unsaved changes)
- Auto-focus on first input (activity type) when modal opens
- Logical tab order through form fields
- Required fields clearly marked with asterisk (*)
- Real-time validation on blur (immediate feedback)
- Loading state during save: disabled inputs, spinner on button
- Optimistic UI update: activity appears in list immediately after save
- Error handling: keep modal open on error, display error message
- Success: close modal, show activity in list (or updated)

**Accessibility Considerations:**
- Modal has proper ARIA attributes:
  - `role="dialog"`
  - `aria-labelledby` pointing to title
  - `aria-describedby` for instructions (if present)
- Focus trapped within modal during interaction
- Focus returns to triggering button (Edit or Add Activity) on close
- Screen reader announces field errors via `aria-live`
- Required fields marked with `aria-required="true"`
- Keyboard navigable:
  - Tab/Shift+Tab to move through fields
  - Enter to submit form (if on submit button)
  - Escape to close modal

**Security Considerations:**
- Client-side validation for immediate UX feedback
- Server-side validation for security (never trust client)
- Input sanitization to prevent XSS attacks
- Data formatted correctly before sending to API (ISO-8601 dates, meters for distance)

**Validation Rules:**
- Activity Type: required, must be one of "Run", "Walk", or "Mixed"
- Date: required, valid date format, not implausible (optional constraint: not far future)
- Duration: required, > 0, minutes < 60, valid HH:MM format
- Distance: optional, if provided must be >= 0, reasonable precision (max 3 decimals)

---

#### Delete Confirmation Modal

**Main Purpose:** Confirm user's intention to permanently delete an activity, preventing accidental data loss.

**Key Information to Display:**
- **Modal Header:**
  - Title: "Delete Activity"

- **Modal Body:**
  - Confirmation question: "Are you sure you want to delete this activity?"
  - Activity details for verification:
    - Activity type badge (e.g., "Run" with blue color)
    - Date: "Monday, Nov 4, 2025"
    - Duration: "1h 30m"
    - Distance: "12.5 km" or "—"
  - Warning text (optional): "This action cannot be undone."

- **Modal Footer:**
  - No/Cancel button (secondary, left-aligned)
  - Yes/Delete button (destructive style - red, right-aligned)
    - Loading state: spinner during deletion, disabled

**Key View Components:**
- `DeleteConfirmationModal` (AlertDialog from Shadcn/ui)
- `ConfirmationText` - Clear, direct question
- `ActivityDetailsDisplay` - Summary of activity being deleted
- `CancelButton` - Safe default action
- `DeleteButton` - Destructive action with loading state

**UX Considerations:**
- Clear, direct language ("Are you sure?")
- Activity details shown to ensure user is deleting the correct item
- Destructive action visually distinct (red color, clear label)
- Loading state during deletion prevents double-clicks
- Optimistic UI update: activity removed from list immediately
- Error handling: if delete fails, show error in modal and restore activity in list
- Focus on Cancel button by default (safer choice)

**Accessibility Considerations:**
- Modal ARIA attributes (role="alertdialog" for destructive action)
- Focus on Cancel button by default
- Keyboard accessible:
  - Tab to switch between buttons
  - Enter activates focused button
  - Escape closes modal (same as Cancel)
- Screen reader announces modal content and destructive nature

**Security Considerations:**
- Only activity owner can delete (enforced by API RLS)
- Confirmation prevents accidental deletion
- DELETE request idempotent (repeated calls safe)
- No sensitive data in confirmation message

---

#### Month/Year Picker Modal

**Main Purpose:** Allow users to quickly navigate to any month and year without multiple clicks.

**Key Information to Display:**
- **Modal Header:**
  - Title: "Select Month and Year"
  - Close button (X icon)

- **Modal Body:**
  - Month selector:
    - Dropdown or grid of buttons (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec)
  - Year selector:
    - Dropdown or number input
    - Reasonable range: e.g., current year - 5 to current year
  - Alternative: Combined calendar grid view

- **Modal Footer:**
  - Cancel button (secondary)
  - Select/Go button (primary)

**Key View Components:**
- `MonthYearPickerModal` (Dialog from Shadcn/ui)
- `MonthSelector` - Dropdown or button grid for month selection
- `YearSelector` - Dropdown or number input for year
- `CancelButton`
- `SelectButton` - Confirms selection and updates activity list

**UX Considerations:**
- Quick selection with minimal clicks (grid may be faster than dropdowns)
- Visual feedback for currently selected month/year
- Reasonable year range (don't allow implausible dates)
- Fast interaction: select month, select year, click Go
- Cancel returns to previous month selection without changes

**Accessibility Considerations:**
- Keyboard navigable (Tab, arrow keys for dropdowns/grids)
- Screen reader announces selected month and year
- Clear labels for selectors
- Focus management when modal opens/closes

**Security Considerations:**
- Input validation to prevent invalid dates
- No security risks (read-only operation, date range filtering)

---

## 3. User Journey Map

### 3.1 New User Journey (First-Time User Experience)

**Goal:** Create account, add first activity, view activity list.

```
1. User visits app URL (e.g., https://activitylogger.example.com)
   └─> System checks authentication status → Not authenticated

2. System redirects to /login
   └─> Login page displays with "Create Account" link visible

3. User clicks "Create Account" link
   └─> Navigate to /signup

4. User fills registration form:
   - Email: john@example.com
   - Password: ••••••••••
   - Confirm Password: ••••••••••

5. User clicks "Sign Up" button
   └─> Client validates inputs (email format, password strength, passwords match)
   └─> API call: POST /api/auth/signup
   └─> Success: Session created, JWT stored in httpOnly cookie

6. System redirects to /activities (default authenticated page)
   └─> API call: GET /api/profile (fetch distance unit preference)
   └─> API call: GET /api/activities?from=2025-11-01&to=2025-11-30
   └─> No activities found

7. Empty state displays:
   - Icon/illustration
   - Message: "Start tracking your activities"
   - Helpful hint: "Record your first run or walk to begin"
   - "Add Activity" button (prominent)

8. User clicks "Add Activity" button
   └─> ActivityFormModal opens with default values

9. User fills activity form:
   - Activity Type: Run (selected)
   - Date: Nov 10, 2025 (today, default)
   - Duration: 01:30 (1 hour, 30 minutes)
   - Distance: 10 (km, based on profile default)

10. User clicks "Save Activity" button
    └─> Client validates inputs
    └─> API call: POST /api/activities
    └─> Request body:
        {
          "activityDate": "2025-11-10T12:00:00Z",
          "duration": "PT1H30M",
          "activityType": "Run",
          "distanceMeters": 10000
        }
    └─> Success: Activity created, API returns activity object

11. Modal closes automatically
    └─> Optimistic update: Activity appears immediately in list
    └─> Activity displayed under "Today" date header:
        - Blue "Run" badge
        - "Today, 12:00 PM"
        - Duration: "1h 30m"
        - Distance: "10.0 km"
        - Edit and Delete buttons visible

12. User sees confirmation of first activity
    └─> Success! User has completed core workflow
```

**Key Moments:**
- **Moment of delight:** Smooth transition from signup to activity list
- **Activation moment:** First activity saved and immediately visible
- **Confidence building:** Clear feedback at each step

---

### 3.2 Returning User Journey (Daily Activity Logging)

**Goal:** Log in, view recent activities, add new activity.

```
1. User visits app URL
   └─> System checks authentication
   └─> Valid session exists

2. System redirects to /activities (authenticated home)
   └─> API call: GET /api/profile
   └─> API call: GET /api/activities?from=2025-11-01&to=2025-11-30
   └─> Display current month activities (November 2025)

3. Activity list displays with grouped dates:

   Today (Sunday, Nov 10)
   [No activities]

   Saturday, Nov 9
   - Walk | 7:00 AM | 0h 45m | 3.2 km | [Edit] [Delete]

   Friday, Nov 8
   - Run | 6:30 AM | 1h 15m | 10.5 km | [Edit] [Delete]

   Wednesday, Nov 6
   - Mixed | 5:00 PM | 1h 0m | — | [Edit] [Delete]

4. User clicks "Add Activity" button below month navigation
   └─> ActivityFormModal opens

5. User fills form for today's run:
   - Activity Type: Run
   - Date: Nov 10, 2025 (today, default)
   - Duration: 01:45 (1 hour, 45 minutes)
   - Distance: 12.5 (km)

6. User clicks "Save Activity"
   └─> API call: POST /api/activities
   └─> Success

7. Modal closes, activity appears immediately:

   Today (Sunday, Nov 10)
   - Run | 12:30 PM | 1h 45m | 12.5 km | [Edit] [Delete]  ← New!

   Saturday, Nov 9
   - Walk | 7:00 AM | 0h 45m | 3.2 km | [Edit] [Delete]

8. User continues browsing, satisfied with logged activity
```

**Key Moments:**
- **Quick access:** Authenticated user goes directly to activity list
- **Context awareness:** Current month displayed by default
- **Immediate feedback:** New activity appears instantly

---

### 3.3 Activity Editing Journey

**Goal:** Correct an error in a previously logged activity.

```
1. User on /activities views list and spots error

   Saturday, Nov 9
   - Walk | 7:00 AM | 0h 45m | 3.2 km | [Edit] [Delete]

   User realizes: Distance was actually 5.0 km, not 3.2 km

2. User clicks "Edit" button on activity card
   └─> API call (optional): GET /api/activities/{activityId}
       (or use cached data from list)
   └─> ActivityFormModal opens in edit mode

3. Modal displays with pre-populated data:
   - Title: "Edit Activity"
   - Activity Type: Walk (selected)
   - Date: Nov 9, 2025
   - Duration: 00:45
   - Distance: 3.2 ← User will change this

4. User modifies distance field:
   - Distance: 3.2 → 5.0 (changes value)

5. User clicks "Update Activity" button
   └─> Client validates inputs
   └─> API call: PATCH /api/activities/{activityId}
   └─> Request body:
       {
         "distanceMeters": 5000
       }
       (only changed field sent)
   └─> Success

6. Modal closes automatically
   └─> Optimistic update: Activity card updates immediately:

   Saturday, Nov 9
   - Walk | 7:00 AM | 0h 45m | 5.0 km | [Edit] [Delete]  ← Updated!

7. User confirms correction is visible
   └─> Edit complete
```

**Key Moments:**
- **Easy access:** Edit button clearly visible on hover/focus
- **Context preserved:** Pre-populated form shows current values
- **Selective update:** Only changed fields need to be modified
- **Immediate feedback:** Updated activity visible instantly

---

### 3.4 Activity Deletion Journey

**Goal:** Remove an incorrectly logged or duplicate activity.

```
1. User on /activities identifies duplicate activity

   Friday, Nov 8
   - Run | 6:30 AM | 1h 15m | 10.5 km | [Edit] [Delete]
   - Run | 6:30 AM | 1h 15m | 10.5 km | [Edit] [Delete]  ← Duplicate!

2. User clicks "Delete" button on second (duplicate) activity
   └─> DeleteConfirmationModal opens

3. Modal displays:
   - Title: "Delete Activity"
   - Message: "Are you sure you want to delete this activity?"
   - Activity details:
     - Run (blue badge)
     - Friday, Nov 8, 2025
     - Duration: 1h 15m
     - Distance: 10.5 km
   - Warning: "This action cannot be undone."
   - [No] [Yes, Delete] buttons
   - Focus on "No" button (safe default)

4. User reviews activity details to confirm it's correct one
   └─> Confirms this is the duplicate

5. User clicks "Yes, Delete" button
   └─> Button shows loading spinner: "Deleting..."
   └─> API call: DELETE /api/activities/{activityId}
   └─> Success: Activity deleted from database

6. Modal closes automatically
   └─> Optimistic update: Activity removed from list immediately:

   Friday, Nov 8
   - Run | 6:30 AM | 1h 15m | 10.5 km | [Edit] [Delete]  ← Only one remains

7. User confirms duplicate is gone
   └─> Deletion complete

Error Scenario (Network Failure):

5a. User clicks "Yes, Delete" button
    └─> API call fails (network error)
    └─> Error message displays in modal: "Failed to delete activity. Please try again."
    └─> Activity remains in list (optimistic update reverted)
    └─> Modal stays open with [Cancel] [Retry] buttons

5b. User clicks "Retry"
    └─> API call retried
    └─> Success or continued failure handling
```

**Key Moments:**
- **Safety measure:** Confirmation modal prevents accidental deletion
- **Verification:** Activity details shown to ensure correct item
- **Destructive clarity:** Red "Delete" button signals irreversible action
- **Error recovery:** Failed deletion doesn't lose data, allows retry

---

### 3.5 Month Navigation Journey

**Goal:** View activities from previous months.

```
1. User on /activities viewing current month (November 2025)
   └─> Month navigation shows: [← Oct] [Nov 2025 ▼] [Dec →] [Today]
   └─> Next button disabled (December is future month)

2. User clicks previous month button (← Oct)
   └─> Month state updates to October 2025
   └─> Skeleton loaders display (3-5 cards)
   └─> API call: GET /api/activities?from=2025-10-01&to=2025-10-31
   └─> Data loads

3. October activities display:

   [← Sep] [Oct 2025 ▼] [Nov →] [Today]

   Monday, Oct 28
   - Run | 6:00 AM | 1h 30m | 11.0 km | [Edit] [Delete]

   Friday, Oct 25
   - Walk | 6:00 PM | 0h 40m | 3.5 km | [Edit] [Delete]

   ... (more activities)

4. User continues clicking previous month (← Sep)
   └─> September 2025 activities load

5. User wants to jump directly to current month
   └─> User clicks "Today" button

6. Month state updates to November 2025
   └─> API call: GET /api/activities?from=2025-11-01&to=2025-11-30
   └─> November activities display (back to current month)

Alternative: Month/Year Picker

4a. User wants to jump to specific month (e.g., January 2025)
    └─> User clicks "Oct 2025 ▼" (month/year display)
    └─> MonthYearPickerModal opens

4b. User selects in modal:
    - Month: January
    - Year: 2025

4c. User clicks "Go" button
    └─> Modal closes
    └─> Month state updates to January 2025
    └─> API call: GET /api/activities?from=2025-01-01&to=2025-01-31
    └─> January activities display
```

**Key Moments:**
- **Sticky navigation:** Month controls always accessible during scroll
- **Loading feedback:** Skeleton loaders during data fetch
- **Quick return:** "Today" button for instant navigation to current month
- **Flexible navigation:** Incremental (prev/next) or direct jump (picker)

---

### 3.6 Profile Management Journey

**Goal:** Change distance unit preference from miles to kilometers.

```
1. User on /activities clicks user icon in topbar (top-right)
   └─> Dropdown menu opens:
       - john_runner (username, display only)
       - Profile (link)
       - ──────── (divider)
       - Logout (button)

2. User clicks "Profile" link
   └─> Navigate to /profile

3. Profile page displays:
   └─> API call: GET /api/profile
   └─> Form shows:

       User Profile

       Username
       [john_runner]

       Email
       john@example.com (read-only)

       Distance Unit Preference
       ( ) Kilometers (km)
       (•) Miles (mi)  ← Currently selected

       [Change Password]

       [Save Changes]

4. User clicks "Kilometers (km)" radio button
   └─> Selection updates:
       (•) Kilometers (km)  ← Now selected
       ( ) Miles (mi)

5. User clicks "Save Changes" button
   └─> Button shows loading: "Saving..."
   └─> API call: PATCH /api/profile
   └─> Request body:
       {
         "distanceUnit": "km"
       }
   └─> Success

6. Success message displays briefly:
   └─> "Profile updated successfully"
   └─> UserPreferencesContext updates with new distanceUnit: "km"

7. System redirects to /activities
   └─> All distances now display in kilometers:

   Today
   - Run | 12:30 PM | 1h 45m | 20.1 km | [Edit] [Delete]
                                ^^^^^ Converted from 12.5 mi

8. User confirms change is reflected
   └─> Profile update complete
```

**Key Moments:**
- **Easy access:** Profile link always available in user menu
- **Clear current state:** Radio buttons show current selection
- **Immediate effect:** Distance unit changes reflected throughout app
- **Smooth transition:** Redirect back to activities after save

---

### 3.7 Password Reset Journey

**Goal:** Reset forgotten password and regain account access.

```
1. User on /login page, cannot remember password
   └─> User clicks "Forgot Password?" link

2. Navigate to /password-reset
   └─> Page displays:

       Reset Password

       Enter your email address and we'll send you a link to reset your password.

       Email
       [________________]

       [Send Reset Link]

       [Back to Login]

3. User enters email:
   - Email: john@example.com

4. User clicks "Send Reset Link" button
   └─> Button shows loading: "Sending..."
   └─> API call: POST /api/auth/password-reset
   └─> Request body:
       {
         "email": "john@example.com"
       }
   └─> Success (202 Accepted)

5. Success message displays:
   └─> "If an account exists with that email, you'll receive a password reset link shortly."
   └─> (Generic message for security - doesn't reveal if email exists)

6. User checks email inbox
   └─> Email received: "Reset Your Password"
   └─> Email contains secure, time-limited link

7. User clicks link in email
   └─> Browser opens to Supabase-hosted password reset page
       (or in-app page if custom implementation)

8. Reset password page displays:

   Set New Password

   New Password
   [________________]

   Confirm New Password
   [________________]

   [Reset Password]

9. User enters new password:
   - New Password: ••••••••••••
   - Confirm: ••••••••••••

10. User clicks "Reset Password" button
    └─> Supabase validates and updates password
    └─> Success

11. Confirmation page displays:
    └─> "Password updated successfully"
    └─> [Go to Login] button

12. User clicks "Go to Login"
    └─> Navigate to /login

13. User logs in with new password:
    - Email: john@example.com
    - Password: •••••••••••• (new password)

14. User clicks "Login"
    └─> API call: POST /api/auth/login
    └─> Success: Session created

15. System redirects to /activities
    └─> User has regained account access
```

**Key Moments:**
- **Easy initiation:** "Forgot Password?" link clearly visible on login
- **Security by design:** Generic confirmation message
- **Email verification:** Reset only possible with email access
- **Secure process:** Time-limited token, strong password validation
- **Smooth recovery:** Direct path back to login after reset

---

### 3.8 Logout Journey

**Goal:** Securely end session and return to login.

```
1. User on /activities wants to log out
   └─> User clicks user icon in topbar

2. Dropdown menu opens:
   - john_runner
   - Profile
   - ──────────
   - Logout  ← User clicks this

3. Logout action triggered:
   └─> API call: POST /api/auth/logout
   └─> Session invalidated
   └─> JWT cookie cleared
   └─> AuthContext state updated (user: null, authenticated: false)

4. System redirects to /login
   └─> Login page displays
   └─> Optional: Success message "You have been logged out"

5. User sees login form
   └─> Session ended successfully
```

**Key Moments:**
- **Easy access:** Logout always available in user menu
- **Immediate effect:** Session cleared, redirect to login
- **Security:** Server-side session invalidation, cookie cleared

---

## 4. Layout and Navigation Structure

### 4.1 Page Hierarchy

```
Activity Logger Application
│
├── Unauthenticated Section
│   ├── /login (Login Page)
│   │   ├── Links to: /signup, /password-reset
│   │   └── Redirects to: /activities (after successful login)
│   │
│   ├── /signup (Registration Page)
│   │   ├── Links to: /login
│   │   └── Redirects to: /activities (after successful signup)
│   │
│   └── /password-reset (Password Reset Request Page)
│       ├── Links to: /login
│       └── External: Supabase password reset flow
│
└── Authenticated Section (protected by middleware)
    ├── /activities (Main Activity List - Home/Default)
    │   ├── Contains: Month navigation, activity list, modals
    │   ├── Topbar links to: /profile (via user menu)
    │   └── Modals (overlay, no route change):
    │       ├── Activity Form Modal (create/edit)
    │       ├── Delete Confirmation Modal
    │       └── Month/Year Picker Modal
    │
    └── /profile (User Profile and Settings)
        ├── Topbar links to: /activities (via logo or back)
        └── Redirects to: /activities (after save)
```

### 4.2 Navigation Mechanisms

#### Topbar Navigation (Authenticated Pages Only)

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│  🏃 ActivityLogger          [john_runner ▼]         │
└─────────────────────────────────────────────────────┘
```

**Components:**
- **Left Section:**
  - Logo/Brand (clickable link to /activities)

- **Right Section:**
  - User Menu (dropdown trigger)
    - Username display
    - Profile link → /profile
    - Logout button → POST /api/auth/logout → /login

**Behavior:**
- Sticky at top (always visible during scroll)
- Consistent across all authenticated pages
- User menu closes on click outside or Escape key
- Dropdown fully accessible via keyboard (Tab, Enter, Arrow keys)

**Responsive Behavior:**
- Desktop (lg+): Full display as shown
- Mobile (future): Hamburger menu or simplified layout

---

#### Month Navigation (Activity List Page Only)

**Structure:**
```
┌────────────────────────────────────────────────┐
│  [← Oct]  [November 2025 ▼]  [Dec →]  [Today] │
└────────────────────────────────────────────────┘
```

**Components:**
- **Previous Month Button** (← icon/text)
  - Loads activities for previous month
  - Disabled if no earlier activities (optional) or always enabled

- **Current Month/Year Display** (clickable)
  - Shows currently selected month and year
  - Click to open Month/Year Picker Modal
  - Dropdown indicator (▼) suggests interactivity

- **Next Month Button** (→ icon/text)
  - Loads activities for next month
  - Disabled if selected month is current month (no future activities)

- **Today Button**
  - Quick navigation to current month
  - Highlighted if current month is not selected

**Behavior:**
- Sticky position below topbar (always visible during scroll)
- State-based (no URL changes, updates component state)
- Clicking prev/next triggers:
  1. Update selected month state
  2. Display skeleton loaders
  3. Fetch activities for new month: GET /api/activities?from=...&to=...
  4. Render new activity list
- Clicking Today jumps to current month
- Month/Year Display opens picker modal for direct navigation

**Responsive Behavior:**
- Desktop (lg+): Horizontal layout as shown
- Tablet (md): Slightly condensed spacing
- Mobile (future): Vertical stack or icon-only buttons

---

#### Modal Navigation

**Behavior:**
- Modals open as overlays (no route/URL changes)
- Focus trapped within modal during interaction
- Multiple ways to close:
  - X button (top-right corner)
  - Cancel button (footer, left-aligned)
  - Escape key
  - Click outside modal (for non-critical modals)
- Focus returns to trigger element on close (e.g., Add Activity button, Edit button)
- Only one modal open at a time

**Modal Types:**
1. **Activity Form Modal**: Create or edit activity
2. **Delete Confirmation Modal**: Confirm deletion
3. **Month/Year Picker Modal**: Select month and year

---

#### Link Navigation

**Unauthenticated Pages:**
- Login page links:
  - "Create Account" → /signup
  - "Forgot Password?" → /password-reset
- Signup page links:
  - "Already have an account?" → /login
- Password reset page links:
  - "Back to Login" → /login

**Authenticated Pages:**
- Logo/Brand in topbar → /activities
- User menu "Profile" link → /profile
- Logout button → POST /api/auth/logout → Redirect to /login

---

### 4.3 Authentication Flow and Redirects

**Middleware Protection:**
```javascript
// Simplified middleware logic
export const onRequest = async (context, next) => {
  const { pathname } = context.url;
  const publicPaths = ['/login', '/signup', '/password-reset'];

  // Allow public paths without authentication
  if (publicPaths.includes(pathname)) {
    return next();
  }

  // Check for valid session
  const session = await getSession(context.cookies);

  if (!session) {
    // Not authenticated: redirect to login with return URL
    return context.redirect(`/login?returnTo=${pathname}`);
  }

  // Authenticated: proceed
  context.locals.user = session.user;
  return next();
};
```

**Redirect Rules:**
1. **Unauthenticated user accesses protected page:**
   - Example: User visits /activities without session
   - Action: Redirect to /login?returnTo=/activities
   - After login: Redirect to /activities (from returnTo parameter)

2. **Successful login:**
   - From /login form submission → /activities (or returnTo URL)

3. **Successful signup:**
   - From /signup form submission → /activities

4. **Logout:**
   - From any authenticated page → POST /api/auth/logout → /login

5. **Successful profile save:**
   - From /profile form submission → /activities (or back to referring page)

6. **Session expiration (401 error):**
   - Action: Attempt to refresh session
   - If refresh succeeds: Continue with original request
   - If refresh fails: Redirect to /login?returnTo=[current page]

---

### 4.4 Breadcrumb and Context Indicators

**Current Location Indicators:**
- **Page Title**: Each page has clear heading (e.g., "User Profile")
- **Active Navigation**: User menu shows which section is active (future enhancement)
- **Month Display**: Month navigation shows current selected month
- **Modal Titles**: Clear titles indicate context (e.g., "Add Activity" vs "Edit Activity")

**Breadcrumb (Optional Future Enhancement):**
```
Activity Logger > Profile
Activity Logger > Activities > November 2025
```

---

## 5. Key Components

### 5.1 Layout Components

#### `UnauthenticatedLayout`
**Purpose:** Minimal wrapper for authentication pages (login, signup, password reset).

**Structure:**
- Logo/branding centered at top
- Main content area (centered, max-width)
- Footer with legal links (optional): Terms, Privacy

**Usage:**
- Wraps /login, /signup, /password-reset pages
- No navigation or user menu
- Clean, focused design

---

#### `AuthenticatedLayout`
**Purpose:** Primary layout for all authenticated pages with persistent topbar and context providers.

**Structure:**
- TopBar component (sticky at top)
- Main content area (full-width or contained)
- React Context Providers:
  - AuthProvider (user session, login/logout methods)
  - UserPreferencesProvider (distance unit, username)

**Usage:**
- Wraps /activities, /profile pages
- Provides auth state to all child components
- Manages session refresh and 401 handling

---

### 5.2 Navigation Components

#### `TopBar`
**Purpose:** Persistent navigation bar for authenticated pages.

**Key Features:**
- Logo/brand (left, links to /activities)
- UserMenu component (right)
- Sticky positioning
- Responsive design

**Props:**
- `user` (object): Current user data (username, email)

**Accessibility:**
- Semantic `<nav>` element
- Skip link to main content
- Keyboard navigable

---

#### `UserMenu`
**Purpose:** Dropdown menu for user-related actions.

**Key Features:**
- User icon/avatar as trigger
- Dropdown on click
- Menu items:
  - Username (display, non-interactive)
  - "Profile" link
  - Divider
  - "Logout" button

**State:**
- `isOpen` (boolean): Dropdown visibility

**Behavior:**
- Click outside to close
- Escape key to close
- Click menu item to close and navigate

**Accessibility:**
- ARIA attributes for dropdown (aria-haspopup, aria-expanded)
- Keyboard navigation (Tab, Enter, Arrow keys)
- Focus management

---

#### `MonthNavigation`
**Purpose:** Month selection controls for activity list.

**Key Features:**
- Previous month button
- Current month/year display (clickable)
- Next month button
- Today button
- Sticky positioning below topbar

**State:**
- `selectedMonth` (Date): Currently selected month

**Events:**
- `onPreviousMonth`: Load previous month activities
- `onNextMonth`: Load next month activities
- `onToday`: Jump to current month
- `onMonthClick`: Open Month/Year Picker Modal

**Accessibility:**
- Button labels and ARIA labels
- Disabled state clearly indicated
- Keyboard accessible

---

### 5.3 Activity List Components

#### `ActivityList`
**Purpose:** Container component managing activity data fetching, state, and rendering.

**Key Features:**
- Fetches activities for selected month
- Groups activities by date
- Renders DateHeader and ActivityCard components
- Handles loading and empty states
- Manages optimistic updates

**State:**
- `activities` (array): List of activities for selected month
- `loading` (boolean): Data fetch in progress
- `error` (string): Error message if fetch fails

**API Integration:**
- `GET /api/activities?from=YYYY-MM-01&to=YYYY-MM-31`

**Child Components:**
- DateHeader (for each unique date)
- ActivityCard (for each activity)
- EmptyState (if no activities)
- SkeletonLoader (during loading)

---

#### `DateHeader`
**Purpose:** Visual divider grouping activities by date.

**Key Features:**
- Displays formatted date (e.g., "Monday, Nov 4" or "Today")
- Sticky on scroll (optional)
- Semantic heading element

**Props:**
- `date` (Date): Date to display
- `isToday` (boolean): Whether date is today
- `isYesterday` (boolean): Whether date is yesterday

**Formatting:**
- Today: "Today"
- Yesterday: "Yesterday"
- This year: "Monday, Nov 4"
- Other years: "Monday, Nov 4, 2024"

**Accessibility:**
- Semantic `<h2>` or `<h3>` element
- Clear visual separation from activities

---

#### `ActivityCard`
**Purpose:** Display individual activity with all details and actions.

**Key Features:**
- Activity type badge (colored)
- Date and time (optional)
- Duration (formatted)
- Distance (with unit or "—")
- Edit button
- Delete button

**Props:**
- `activity` (object): Activity data
  - `activityId` (string)
  - `activityType` ("Run" | "Walk" | "Mixed")
  - `activityDate` (ISO string)
  - `duration` (ISO duration or HH:MM:SS)
  - `distanceMeters` (number, optional)
- `distanceUnit` ("km" | "mi"): From user preferences
- `onEdit` (function): Handler for edit action
- `onDelete` (function): Handler for delete action

**Visual Design:**
- Card layout with padding, border, hover state
- Activity type badge:
  - Run: Blue background (#2563eb)
  - Walk: Green background (#16a34a)
  - Mixed: Orange background (#ea580c)
- Duration formatted: "1h 30m" or "0h 45m"
- Distance formatted: "12.5 km" or "7.8 mi" or "—"
- Edit/Delete buttons:
  - Text buttons or icon buttons
  - Visible on hover (desktop) or always visible (mobile)

**Accessibility:**
- Semantic `<article>` element
- Activity type color meets WCAG AA contrast
- ARIA labels for action buttons
- Keyboard accessible (Tab to buttons, Enter/Space to activate)

---

#### `EmptyState`
**Purpose:** Display when no activities exist for selected month.

**Key Features:**
- Icon or illustration
- Message text (contextual)
- Call-to-action button

**Props:**
- `month` (string): Month name for display
- `isFirstTime` (boolean): Whether user has any activities at all
- `onAddActivity` (function): Handler for Add Activity button

**Messages:**
- No activities in month: "No activities in November 2025"
- First-time user: "Start tracking your activities" + helpful hint

**Visual Design:**
- Centered vertically and horizontally
- Large, friendly icon
- Clear, encouraging message
- Prominent Add Activity button

**Accessibility:**
- Semantic structure
- Clear call-to-action
- Keyboard accessible button

---

#### `SkeletonLoader`
**Purpose:** Loading placeholder during data fetch.

**Key Features:**
- Mimics ActivityCard structure
- Animated shimmer effect
- Multiple cards (3-5)

**Visual Design:**
- Gray rectangles with shimmer animation
- Same dimensions as ActivityCard
- Smooth fade-in/fade-out

**Accessibility:**
- ARIA live region announcing "Loading activities"
- Not keyboard focusable

---

### 5.4 Form and Modal Components

#### `ActivityFormModal`
**Purpose:** Modal for creating or editing activities.

**Key Features:**
- Dialog component (Shadcn/ui)
- Form with validation
- Activity type selector
- Date picker
- Duration input
- Distance input
- Cancel and Save buttons

**Props:**
- `isOpen` (boolean): Modal visibility
- `mode` ("create" | "edit"): Form mode
- `initialData` (object, optional): Pre-populated data for edit mode
- `onClose` (function): Handler for modal close
- `onSave` (function): Handler for form submission

**State:**
- Form field values (activityType, date, duration, distance)
- Validation errors (per field)
- Loading state (during save)

**Validation Rules:**
- Activity Type: required
- Date: required, valid date
- Duration: required, > 0, minutes < 60, format HH:MM
- Distance: optional, >= 0 if provided

**API Integration:**
- Create: `POST /api/activities`
- Edit: `PATCH /api/activities/{activityId}`

**Accessibility:**
- Focus trap within modal
- ARIA dialog attributes
- Keyboard navigation (Tab, Enter to submit, Escape to close)
- Error announcements

---

#### `ActivityTypeSelector`
**Purpose:** Segmented control for selecting activity type.

**Key Features:**
- Three options: Run, Walk, Mixed
- Single selection
- Visual feedback for selected state
- Optional icons

**Props:**
- `value` ("Run" | "Walk" | "Mixed"): Selected type
- `onChange` (function): Handler for selection change
- `error` (string, optional): Validation error

**Visual Design:**
- Three buttons side-by-side
- Selected button highlighted
- Color preview (Run=blue, Walk=green, Mixed=orange)

**Accessibility:**
- Radio button group semantics (role="radiogroup")
- ARIA labels and checked states
- Keyboard navigation (arrow keys)

---

#### `DurationInput`
**Purpose:** Input for activity duration in HH:MM format.

**Key Features:**
- Two number inputs (hours, minutes) or single masked input
- Validation: duration > 0, minutes < 60
- Clear formatting

**Props:**
- `value` (string): Duration in HH:MM format (e.g., "01:30")
- `onChange` (function): Handler for value change
- `error` (string, optional): Validation error

**Implementation Options:**
1. Two number inputs:
   - Hours: number input (0-99)
   - Minutes: number input (0-59)
   - Separator: ":"
2. Single masked text input:
   - Mask: "HH:MM"
   - Validation on blur

**Accessibility:**
- Clear labels for each input
- Error message associated with input
- Input type="number" or pattern for validation

---

#### `DistanceInput`
**Purpose:** Input for activity distance with unit conversion.

**Key Features:**
- Number input
- Unit label (km or mi) from user preferences
- Optional field (clear indication)

**Props:**
- `value` (number): Distance in user's preferred unit
- `unit` ("km" | "mi"): From user preferences
- `onChange` (function): Handler for value change
- `error` (string, optional): Validation error

**Visual Design:**
- Number input with unit suffix
- Placeholder: "Leave empty if unknown"

**Data Conversion:**
- Display: User's preferred unit (10.0 km)
- API: Always meters (10000)
- Conversion on save/load

**Accessibility:**
- Clear label with unit indication
- Optional status clearly stated
- Validation for non-negative values

---

#### `DeleteConfirmationModal`
**Purpose:** Confirmation dialog for activity deletion.

**Key Features:**
- AlertDialog component (Shadcn/ui)
- Activity details display
- Cancel and Delete buttons

**Props:**
- `isOpen` (boolean): Modal visibility
- `activity` (object): Activity to delete
- `onClose` (function): Handler for cancel
- `onConfirm` (function): Handler for delete confirmation

**State:**
- `loading` (boolean): During deletion API call

**Visual Design:**
- Clear confirmation question
- Activity details (type, date, duration, distance)
- Destructive Delete button (red)
- Safe Cancel button (default focus)

**API Integration:**
- `DELETE /api/activities/{activityId}`

**Accessibility:**
- AlertDialog role
- Focus on Cancel button by default
- Keyboard navigation (Tab, Enter, Escape)

---

#### `MonthYearPickerModal`
**Purpose:** Modal for selecting any month and year.

**Key Features:**
- Dialog component (Shadcn/ui)
- Month selector (dropdown or grid)
- Year selector (dropdown or number input)
- Cancel and Select buttons

**Props:**
- `isOpen` (boolean): Modal visibility
- `initialMonth` (Date): Currently selected month
- `onClose` (function): Handler for cancel
- `onSelect` (function): Handler for month/year selection

**State:**
- `selectedMonth` (number): 1-12
- `selectedYear` (number): e.g., 2025

**Visual Design:**
- Simple, fast selection interface
- Clear visual feedback for selection
- Minimal clicks to complete

**Accessibility:**
- Dialog attributes
- Keyboard navigation
- Clear labels

---

### 5.5 Shared UI Components (Shadcn/ui)

The application uses Shadcn/ui components for consistent, accessible UI elements:

#### `Button`
- Variants: primary, secondary, destructive, ghost
- Sizes: sm, md, lg
- Loading state support
- Icon support

#### `Input`
- Text, email, password, number types
- Error state styling
- Label association
- Helper text

#### `Label`
- Associated with form controls
- Required indicator support
- Clear typography

#### `Dialog`
- Modal container
- Focus trap
- Overlay backdrop
- Close on Escape

#### `AlertDialog`
- For destructive actions
- Clear action buttons
- Focus management

#### `Calendar`
- Date picker component
- Keyboard navigation
- Localization support

#### `RadioGroup`
- Grouped radio buttons
- Keyboard navigation (arrow keys)
- Clear selection state

#### `Select`
- Dropdown select
- Search support (optional)
- Keyboard navigation

#### `Skeleton`
- Loading placeholder
- Shimmer animation
- Flexible sizing

#### `Toast`
- Notification component (future use)
- Auto-dismiss
- Multiple positions

#### `NavigationMenu`
- Topbar navigation component
- Dropdown support
- Keyboard accessible

---

### 5.6 Context Providers

#### `AuthContext`
**Purpose:** Manage authentication state across application.

**Provided Values:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Features:**
- Current user data
- Authentication status
- Login/logout methods
- Automatic session refresh
- 401 error handling

**Usage:**
- Wraps AuthenticatedLayout
- Available to all authenticated pages
- Triggers redirects on auth state changes

---

#### `UserPreferencesContext`
**Purpose:** Manage user preferences (distance unit, username).

**Provided Values:**
```typescript
interface UserPreferencesContextType {
  distanceUnit: 'km' | 'mi';
  username: string;
  loading: boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}
```

**Features:**
- Distance unit preference (km or mi)
- Username display
- Update method for preferences
- Automatic distance conversion

**Usage:**
- Wraps AuthenticatedLayout
- Available to all authenticated pages
- Used by ActivityCard, DistanceInput, ProfileForm

---

### 5.7 Utility Components

#### `ErrorBanner`
**Purpose:** Display form-level or page-level errors.

**Props:**
- `message` (string): Error message
- `onDismiss` (function, optional): Handler for dismiss button

**Visual Design:**
- Red background with white text
- Close button (optional)
- Icon indicating error

**Accessibility:**
- ARIA live region for screen reader announcement
- Dismissable via keyboard

---

#### `FieldError`
**Purpose:** Display inline field validation errors.

**Props:**
- `message` (string): Error message

**Visual Design:**
- Small red text below input
- Icon indicating error (optional)

**Accessibility:**
- Associated with input via aria-describedby
- Announced to screen readers

---

#### `LoadingSpinner`
**Purpose:** Visual indicator for loading states.

**Props:**
- `size` ("sm" | "md" | "lg"): Spinner size
- `text` (string, optional): Loading text

**Visual Design:**
- Circular spinning animation
- Optional text: "Loading..." or "Saving..."

**Accessibility:**
- ARIA live region
- Not keyboard focusable

---

This UI architecture provides a comprehensive foundation for building the Activity Logger MVP, with clear structure, accessible components, and thoughtful user journeys that address user pain points while maintaining simplicity and security.
