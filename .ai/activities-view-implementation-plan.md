# View Implementation Plan: Activities List View

## 1. Overview

The Activities List View (`/activities`) is the main authenticated view of the Activity Logger application. It serves as the primary interface for users to view, create, edit, and delete their run/walk/mixed activity entries. The view displays activities organized by date for a selected month, with a sticky month navigation bar, activity cards showing key information, and modal-based forms for creating and editing activities.

The view implements a mobile-first, minimalist design approach using Astro 5 with React 19 islands for interactive components. It follows the CRUD requirements from the PRD (FR-004 through FR-009) and addresses user stories US-004 through US-008. The implementation uses Shadcn/ui components for accessible UI elements and integrates with the `/api/activities` endpoint for data operations.

**Key Features:**
- Monthly activity display with date-based grouping
- Sticky month navigation for easy month switching
- Activity cards with type badges, duration, and distance
- Modal-based create/edit forms
- Confirmation dialog for deletions
- Optimistic UI updates for better UX
- Loading and empty states
- Full keyboard navigation and screen reader support

## 2. View Routing

**Path:** `/activities`

**File Location:** `src/pages/activities.astro`

**Route Type:** Server-rendered Astro page (SSR enabled via `export const prerender = false`)

**Layout:** Uses `AuthenticatedLayout` wrapper component (to be created)

**Access Control:** Currently uses `DEFAULT_USER_ID` from `supabase.client.ts. Authentication will be implemented in a separate task.

## 3. Component Structure

```
activities.astro (Astro page)
└── AuthenticatedLayout
    ├── TopBar (React island)
    │   ├── Logo (link to /activities)
    │   └── UserMenu (React island)
    │       ├── Username display
    │       ├── Profile link
    │       └── Logout button
    └── Main content area
        ├── MonthNavigation (React island, sticky)
        │   ├── Previous month button
        │   ├── Current month/year display (clickable)
        │   ├── Next month button
        │   └── "Today" button
        ├── MonthYearPickerModal (React island)
        │   ├── Month selector
        │   ├── Year selector
        │   ├── Confirm button
        │   └── Cancel button
        ├── AddActivityButton (React island)
        └── ActivityList (React island)
            ├── Loading state: SkeletonLoader (3-5 cards)
            ├── Empty state: EmptyState
            └── Activity items
                ├── DateHeader (sticky on scroll)
                └── ActivityCard (React island)
                    ├── Activity type badge
                    ├── Date/time display
                    ├── Duration display
                    ├── Distance display
                    ├── Edit button
                    └── Delete button
        ├── ActivityFormModal (React island)
        │   ├── Form fields
        │   │   ├── Date picker
        │   │   ├── Duration input
        │   │   ├── Activity type selector
        │   │   └── Distance input (optional)
        │   ├── Validation errors
        │   ├── Submit button
        │   └── Cancel button
        └── DeleteConfirmationModal (React island)
            ├── Confirmation message
            ├── Yes button
            └── No/Cancel button
```

## 4. Component Details

### AuthenticatedLayout

- **Component description:** Astro layout component that wraps authenticated pages. Provides consistent structure with topbar navigation and main content area. Handles page-level styling and semantic HTML structure.

- **Main elements:**
  - `<html>`, `<head>`, `<body>` structure
  - `<nav>` for TopBar
  - `<main>` for page content
  - Global CSS imports

- **Handled interactions:** None (static layout wrapper)

- **Handled validation:** None

- **Types:** None (Astro component)

- **Props:**
  - `title?: string` - Page title (defaults to "Activities - Activity Logger")
  - `children` - Slot content (page-specific content)

### TopBar

- **Component description:** React component providing persistent top navigation bar. Displays logo/branding on the left and user menu on the right. Stays visible during scroll.

- **Main elements:**
  - `<nav>` with ARIA label "Main navigation"
  - Logo link (`<a>` or `<Link>` to `/activities`)
  - UserMenu component

- **Handled interactions:**
  - Logo click: Navigate to `/activities`
  - User menu interactions (delegated to UserMenu)

- **Handled validation:** None

- **Types:**
  - Uses `AuthUserBasicDto` from `types.ts` for user data

- **Props:**
  - `user: AuthUserBasicDto` - Current user information (email, userId)
  - `onLogout?: () => void` - Optional logout handler (for future auth implementation)

### UserMenu

- **Component description:** React component displaying user information in a dropdown menu. Shows username/email, provides link to profile page, and logout option. Uses Shadcn/ui DropdownMenu component.

- **Main elements:**
  - DropdownMenu trigger button (user email/username)
  - DropdownMenu content with:
    - User email display
    - Profile link
    - Separator
    - Logout button

- **Handled interactions:**
  - Menu trigger click: Open/close dropdown
  - Profile link click: Navigate to `/profile` (future route)
  - Logout button click: Call `onLogout` handler

- **Handled validation:** None

- **Types:**
  - Uses `AuthUserBasicDto` from `types.ts`

- **Props:**
  - `user: AuthUserBasicDto` - Current user information
  - `onLogout?: () => void` - Logout handler

### MonthNavigation

- **Component description:** React component providing month navigation controls. Sticky positioning keeps it accessible during scroll. Displays current month/year with previous/next buttons and "Today" quick navigation.

- **Main elements:**
  - Container with sticky positioning
  - Previous month button (← icon)
  - Current month/year display (clickable, opens MonthYearPickerModal)
  - Next month button (→ icon)
  - "Today" button

- **Handled interactions:**
  - Previous month button: Decrement month, update selected month state
  - Next month button: Increment month, update selected month state
  - Current month/year click: Open MonthYearPickerModal
  - "Today" button: Set selected month to current month

- **Handled validation:**
  - Disable "Previous" button if selected month is at minimum allowed date
  - Disable "Next" button if selected month is at maximum allowed date
  - "Today" button disabled if already on current month

- **Types:**
  - `selectedMonth: Date` - Currently selected month (first day of month)
  - `onMonthChange: (month: Date) => void` - Callback when month changes

- **Props:**
  - `selectedMonth: Date` - Currently selected month
  - `onMonthChange: (month: Date) => void` - Month change handler
  - `minDate?: Date` - Optional minimum selectable date
  - `maxDate?: Date` - Optional maximum selectable date (defaults to current month)

### MonthYearPickerModal

- **Component description:** React modal component for selecting any month and year. Uses Shadcn/ui Dialog component. Provides month and year dropdown selectors.

- **Main elements:**
  - Dialog component (Shadcn/ui)
  - Month selector (dropdown/select)
  - Year selector (dropdown/select or number input)
  - Confirm button
  - Cancel button

- **Handled interactions:**
  - Month selector change: Update selected month in modal
  - Year selector change: Update selected year in modal
  - Confirm button: Close modal, call `onConfirm` with selected month
  - Cancel button or backdrop click: Close modal without changes
  - Escape key: Close modal

- **Handled validation:**
  - Ensure selected month/year is within allowed range (if minDate/maxDate provided)
  - Validate year is reasonable (e.g., 2000-2100)

- **Types:**
  - `selectedMonth: Date` - Initial selected month
  - `onConfirm: (month: Date) => void` - Confirmation handler
  - `onCancel: () => void` - Cancel handler

- **Props:**
  - `open: boolean` - Modal open state
  - `selectedMonth: Date` - Currently selected month
  - `onConfirm: (month: Date) => void` - Confirmation handler
  - `onCancel: () => void` - Cancel handler
  - `minDate?: Date` - Optional minimum selectable date
  - `maxDate?: Date` - Optional maximum selectable date

### AddActivityButton

- **Component description:** React component rendering primary action button to add a new activity. Opens ActivityFormModal in create mode.

- **Main elements:**
  - Button component (Shadcn/ui) with primary variant
  - Plus icon (lucide-react)
  - Button text: "Add Activity"

- **Handled interactions:**
  - Button click: Open ActivityFormModal in create mode

- **Handled validation:** None

- **Types:** None

- **Props:**
  - `onClick: () => void` - Click handler to open form modal

### ActivityList

- **Component description:** React component managing activity data fetching, state, and rendering. Handles loading states, empty states, and activity grouping by date. Fetches activities for selected month using API.

- **Main elements:**
  - Container div
  - Conditional rendering:
    - Loading: SkeletonLoader components
    - Empty: EmptyState component
    - With data: DateHeader and ActivityCard components grouped by date

- **Handled interactions:**
  - Initial mount: Fetch activities for selected month
  - Selected month change: Refetch activities for new month
  - Activity create/edit/delete: Optimistic updates, then refetch

- **Handled validation:**
  - Validate selected month is valid Date
  - Handle API error responses (400, 401, 500)

- **Types:**
  - Uses `ActivityDto`, `ActivitiesListDto`, `ActivitiesListQuery` from `types.ts`
  - Custom state types:
    - `ActivityListState = { status: 'loading' | 'empty' | 'loaded' | 'error', activities: ActivityDto[], error?: string }`

- **Props:**
  - `selectedMonth: Date` - Selected month for filtering
  - `onActivityEdit: (activity: ActivityDto) => void` - Handler to open edit modal
  - `onActivityDelete: (activityId: string) => void` - Handler to open delete confirmation

### DateHeader

- **Component description:** React component displaying date header for grouping activities. Shows formatted date (e.g., "Monday, Nov 4" or "Today"). Sticky positioning on scroll for better UX.

- **Main elements:**
  - `<h2>` or `<div>` with heading role
  - Formatted date text
  - Optional "Today" indicator

- **Handled interactions:** None (display only)

- **Handled validation:** None

- **Types:**
  - `date: Date` - Date to display

- **Props:**
  - `date: Date` - Date for header
  - `isToday?: boolean` - Whether this date is today
  - `isSticky?: boolean` - Whether header should be sticky on scroll

### ActivityCard

- **Component description:** React component displaying individual activity entry. Shows activity type badge (colored), date/time, duration, distance, and action buttons (edit/delete).

- **Main elements:**
  - Card component (Shadcn/ui) or custom card
  - Activity type badge (Badge component with color variants)
  - Date/time display
  - Duration display (formatted: "1h 30m")
  - Distance display (with unit or "—" if missing)
  - Edit button (icon button)
  - Delete button (icon button)

- **Handled interactions:**
  - Edit button click: Call `onEdit` handler with activity data
  - Delete button click: Call `onDelete` handler with activity ID
  - Card hover: Show action buttons more prominently

- **Handled validation:** None

- **Types:**
  - Uses `ActivityDto` from `types.ts`
  - `distanceUnit: DistanceUnit` - User's preferred distance unit ("km" or "mi")

- **Props:**
  - `activity: ActivityDto` - Activity data to display
  - `distanceUnit: DistanceUnit` - User's preferred distance unit
  - `onEdit: (activity: ActivityDto) => void` - Edit handler
  - `onDelete: (activityId: string) => void` - Delete handler

### EmptyState

- **Component description:** React component displayed when no activities exist for selected month. Encourages user to add first activity with clear call-to-action.

- **Main elements:**
  - Container with centered content
  - Icon/illustration (lucide-react Activity icon)
  - Heading: "No activities in [Month Year]"
  - Subheading: "Start tracking your activities"
  - Add Activity button (same as AddActivityButton)

- **Handled interactions:**
  - Add Activity button click: Call `onAddActivity` handler

- **Handled validation:** None

- **Types:**
  - `selectedMonth: Date` - Selected month for message

- **Props:**
  - `selectedMonth: Date` - Selected month
  - `onAddActivity: () => void` - Handler to open add activity form

### SkeletonLoader

- **Component description:** React component providing loading placeholder. Renders 3-5 skeleton activity cards to indicate data is being fetched.

- **Main elements:**
  - Container with multiple skeleton cards
  - Each skeleton card mimics ActivityCard structure:
    - Skeleton badge
    - Skeleton text lines (date, duration, distance)
    - Skeleton buttons

- **Handled interactions:** None (loading state)

- **Handled validation:** None

- **Types:** None

- **Props:**
  - `count?: number` - Number of skeleton cards (default: 3)

### ActivityFormModal

- **Component description:** React modal component for creating and editing activities. Uses Shadcn/ui Dialog and Form components. Handles form validation, submission, and error display.

- **Main elements:**
  - Dialog component (Shadcn/ui)
  - Form with fields:
    - Date picker (required)
    - Duration input (required, ISO-8601 or HH:MM:SS format)
    - Activity type selector (required, radio group or select)
    - Distance input (optional, number with decimals)
  - Field-level validation errors
  - Form-level error banner
  - Submit button (disabled during submission)
  - Cancel button

- **Handled interactions:**
  - Form submission: Validate, submit to API (POST for create, PUT/PATCH for edit)
  - Field changes: Real-time validation
  - Cancel button or backdrop click: Close modal, reset form
  - Escape key: Close modal

- **Handled validation:**
  - Date: Required, valid ISO-8601 UTC format
  - Duration: Required, ISO-8601 (PT45M) or HH:MM:SS format, must be > 0
  - Activity type: Required, one of "Run", "Walk", "Mixed"
  - Distance: Optional, number >= 0, max 3 decimal places, max value reasonable (e.g., 1000000000)
  - All validation matches API schema (`createActivityCommandSchema`)

- **Types:**
  - Uses `CreateActivityCommand`, `ReplaceActivityCommand`, `PatchActivityCommand`, `ActivityDto` from `types.ts`
  - Form state: `ActivityFormState = { activityDate: string, duration: string, activityType: ActivityType, distanceMeters?: number }`
  - Validation errors: `Record<string, string>` - Field name to error message

- **Props:**
  - `open: boolean` - Modal open state
  - `mode: 'create' | 'edit'` - Form mode
  - `activity?: ActivityDto` - Activity data for edit mode
  - `onSubmit: (command: CreateActivityCommand | ReplaceActivityCommand) => Promise<void>` - Submit handler
  - `onCancel: () => void` - Cancel handler

### DeleteConfirmationModal

- **Component description:** React modal component for confirming activity deletion. Uses Shadcn/ui AlertDialog component. Prevents accidental deletions.

- **Main elements:**
  - AlertDialog component (Shadcn/ui)
  - Confirmation message: "Are you sure you want to delete this activity?"
  - Activity preview (optional): Brief activity info
  - Yes button (destructive variant)
  - No/Cancel button

- **Handled interactions:**
  - Yes button click: Call `onConfirm` handler, close modal
  - No/Cancel button click: Close modal without deletion
  - Backdrop click: Close modal (if enabled)
  - Escape key: Close modal

- **Handled validation:** None

- **Types:**
  - Uses `ActivityDto` from `types.ts` (optional, for preview)

- **Props:**
  - `open: boolean` - Modal open state
  - `activity?: ActivityDto` - Activity to delete (for preview)
  - `onConfirm: () => Promise<void>` - Confirmation handler
  - `onCancel: () => void` - Cancel handler

## 5. Types

### Existing Types (from `types.ts`)

The view uses the following existing types from `src/types.ts`:

- **ActivityDto:** Complete activity representation from API
  - `activityId: string` (UUID)
  - `userId: string` (UUID)
  - `activityDate: string` (ISO-8601 UTC)
  - `duration: string` (ISO-8601 duration)
  - `activityType: "Run" | "Walk" | "Mixed"`
  - `distanceMeters?: number` (optional, >= 0, up to 3 decimals)

- **CreateActivityCommand:** Payload for creating activities
  - `activityDate: string` (ISO-8601 UTC)
  - `duration: string` (ISO-8601 or HH:MM:SS)
  - `activityType: ActivityType`
  - `distanceMeters?: number` (optional)

- **ReplaceActivityCommand:** Same as CreateActivityCommand (for PUT)

- **PatchActivityCommand:** Partial<CreateActivityCommand> (for PATCH)

- **ActivitiesListQuery:** Query parameters for listing activities
  - `limit?: number` (default 20, max 100)
  - `cursor?: string`
  - `page?: number` (default 1)
  - `pageSize?: number` (default 20, max 100)
  - `from?: string` (ISO date, inclusive)
  - `to?: string` (ISO date, inclusive)
  - `type?: ActivityType`
  - `hasDistance?: boolean`
  - `sort?: "activityDate" | "duration" | "distance"` (default "activityDate")
  - `order?: "asc" | "desc"` (default "desc")

- **ActivitiesListDto:** API response for activity list
  - `items: ActivityDto[]`
  - `nextCursor: string | null`
  - `totalCount: number`

- **ActivityType:** `"Run" | "Walk" | "Mixed"`

- **DistanceUnit:** `"km" | "mi"`

- **AuthUserBasicDto:** User information
  - `userId: string`
  - `email: string`

### New ViewModel Types

The following types should be created in `src/types.ts` or a new `src/types/view-models.ts` file:

```typescript
// Activity list state
export interface ActivityListState {
  status: 'loading' | 'empty' | 'loaded' | 'error';
  activities: ActivityDto[];
  error?: string;
  totalCount?: number;
}

// Grouped activities by date
export interface GroupedActivities {
  date: Date;
  activities: ActivityDto[];
  isToday: boolean;
}

// Activity form state
export interface ActivityFormState {
  activityDate: string; // ISO-8601 UTC
  duration: string; // ISO-8601 or HH:MM:SS
  activityType: ActivityType;
  distanceMeters?: number;
}

// Activity form validation errors
export interface ActivityFormErrors {
  activityDate?: string;
  duration?: string;
  activityType?: string;
  distanceMeters?: string;
  form?: string; // General form error
}

// Month navigation state
export interface MonthNavigationState {
  selectedMonth: Date; // First day of selected month
  currentMonth: Date; // First day of current month
}

// Modal states
export interface ModalStates {
  activityForm: {
    open: boolean;
    mode: 'create' | 'edit';
    activity?: ActivityDto;
  };
  deleteConfirmation: {
    open: boolean;
    activityId?: string;
    activity?: ActivityDto;
  };
  monthPicker: {
    open: boolean;
  };
}
```

## 6. State Management

State management is handled using React hooks and Context API (no external state libraries). The main state is managed in the `ActivityList` component and passed down via props to child components.

### Main State (ActivityList component)

- **Selected Month:** `useState<Date>` - Currently selected month (first day of month)
- **Activity List State:** `useState<ActivityListState>` - Loading/loaded/error state with activities
- **Modal States:** `useState<ModalStates>` - Open/close state for all modals
- **Form State:** `useState<ActivityFormState>` - Form data when modal is open
- **Form Errors:** `useState<ActivityFormErrors>` - Validation errors

### Custom Hooks

**`useActivities` hook** (`src/components/hooks/useActivities.ts`):
- Purpose: Manages activity data fetching, caching, and optimistic updates
- Returns:
  - `activities: ActivityDto[]`
  - `loading: boolean`
  - `error: string | null`
  - `refetch: () => Promise<void>`
  - `createActivity: (command: CreateActivityCommand) => Promise<ActivityDto>`
  - `updateActivity: (id: string, command: ReplaceActivityCommand | PatchActivityCommand) => Promise<ActivityDto>`
  - `deleteActivity: (id: string) => Promise<void>`
- Implementation:
  - Uses `useState` for activities and loading state
  - Uses `useCallback` for API functions
  - Implements optimistic updates (add/update/delete immediately, revert on error)
  - Handles API errors and retries

**`useMonthNavigation` hook** (`src/components/hooks/useMonthNavigation.ts`):
- Purpose: Manages month selection and navigation
- Returns:
  - `selectedMonth: Date`
  - `currentMonth: Date`
  - `goToPreviousMonth: () => void`
  - `goToNextMonth: () => void`
  - `goToToday: () => void`
  - `goToMonth: (month: Date) => void`
- Implementation:
  - Uses `useState` for selected month
  - Calculates current month on mount
  - Validates month ranges

**`useActivityForm` hook** (`src/components/hooks/useActivityForm.ts`):
- Purpose: Manages activity form state and validation
- Returns:
  - `formState: ActivityFormState`
  - `errors: ActivityFormErrors`
  - `setField: (field: keyof ActivityFormState, value: unknown) => void`
  - `validate: () => boolean`
  - `reset: () => void`
  - `initializeFromActivity: (activity: ActivityDto) => void`
- Implementation:
  - Uses `useState` for form state and errors
  - Validates using same rules as API (`createActivityCommandSchema`)
  - Provides real-time validation on field change

### State Flow

1. **Initial Load:**
   - `ActivityList` mounts → `useActivities` hook fetches activities for selected month
   - Loading state shown → Data fetched → Activities displayed

2. **Month Change:**
   - User clicks previous/next → `useMonthNavigation` updates selected month
   - `ActivityList` detects change → `useActivities` refetches for new month

3. **Create Activity:**
   - User opens form modal → `useActivityForm` initializes empty form
   - User fills form → Real-time validation via `useActivityForm`
   - User submits → Optimistic update (add to list) → API call → On success: keep, on error: revert and show error

4. **Edit Activity:**
   - User clicks edit → Modal opens with activity data → `useActivityForm.initializeFromActivity`
   - User modifies → Validation → Submit → Optimistic update → API call → Revert on error

5. **Delete Activity:**
   - User clicks delete → Confirmation modal opens
   - User confirms → Optimistic removal → API call → Revert on error

## 7. API Integration

### Endpoint: GET /api/activities

**Purpose:** Fetch activities for selected month

**Request:**
- Method: `GET`
- URL: `/api/activities`
- Query Parameters:
  - `from: string` - Start of selected month (ISO-8601 date, e.g., "2025-11-01")
  - `to: string` - End of selected month (ISO-8601 date, e.g., "2025-11-30")
  - `sort: "activityDate"` - Sort by date
  - `order: "desc"` - Most recent first
  - `limit: number` - Default 100 (to get all activities in month)

**Response Type:** `ActivitiesListDto`
```typescript
{
  items: ActivityDto[];
  nextCursor: string | null;
  totalCount: number;
}
```

**Error Handling:**
- 400: Invalid query parameters → Show error message
- 401: Unauthorized → Redirect to login (future)
- 500: Server error → Show error message, allow retry

**Implementation:**
```typescript
async function fetchActivities(month: Date): Promise<ActivitiesListDto> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const params = new URLSearchParams({
    from: startOfMonth.toISOString().split('T')[0],
    to: endOfMonth.toISOString().split('T')[0],
    sort: 'activityDate',
    order: 'desc',
    limit: '100'
  });
  
  const response = await fetch(`/api/activities?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }
  return response.json();
}
```

### Endpoint: POST /api/activities

**Purpose:** Create new activity

**Request:**
- Method: `POST`
- URL: `/api/activities`
- Headers: `Content-Type: application/json`
- Body: `CreateActivityCommand`

**Response Type:** `CreateActivityResponseDto` (same as `ActivityDto`)

**Error Handling:**
- 400: Validation error → Display field-level errors
- 422: Unprocessable entity → Display semantic errors
- 500: Server error → Show error, revert optimistic update

**Implementation:**
```typescript
async function createActivity(command: CreateActivityCommand): Promise<ActivityDto> {
  const response = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create activity');
  }
  
  return response.json();
}
```

### Endpoint: PUT /api/activities/{activityId}

**Purpose:** Replace activity (full update)

**Request:**
- Method: `PUT`
- URL: `/api/activities/{activityId}`
- Headers: `Content-Type: application/json`
- Body: `ReplaceActivityCommand` (same as `CreateActivityCommand`)

**Response Type:** `ReplaceActivityResponseDto` (same as `ActivityDto`)

**Error Handling:**
- 400: Validation error → Display field-level errors
- 403: Forbidden (not owner) → Show error
- 404: Not found → Show error, remove from list
- 500: Server error → Show error, revert optimistic update

### Endpoint: PATCH /api/activities/{activityId}

**Purpose:** Partially update activity

**Request:**
- Method: `PATCH`
- URL: `/api/activities/{activityId}`
- Headers: `Content-Type: application/json`
- Body: `PatchActivityCommand` (partial)

**Response Type:** `ActivityDto`

**Note:** Can use PATCH for edit if only changed fields are sent, or PUT for full replace.

### Endpoint: DELETE /api/activities/{activityId}

**Purpose:** Delete activity

**Request:**
- Method: `DELETE`
- URL: `/api/activities/{activityId}`

**Response:** 204 No Content (no body)

**Error Handling:**
- 403: Forbidden → Show error
- 404: Not found → Already deleted, remove from list
- 500: Server error → Show error, revert optimistic update

## 8. User Interactions

### Month Navigation

1. **Previous Month Button Click:**
   - Action: Decrement selected month by 1
   - Outcome: `selectedMonth` state updates → `ActivityList` refetches activities for new month
   - Loading state shown during fetch

2. **Next Month Button Click:**
   - Action: Increment selected month by 1
   - Outcome: Same as previous month

3. **Current Month/Year Display Click:**
   - Action: Open `MonthYearPickerModal`
   - Outcome: Modal displays with current selected month/year
   - User can select different month/year → On confirm, update selected month → Refetch activities

4. **"Today" Button Click:**
   - Action: Set selected month to current month
   - Outcome: If already on current month, button is disabled. Otherwise, jump to current month → Refetch activities

### Activity Creation

1. **Add Activity Button Click:**
   - Action: Open `ActivityFormModal` in create mode
   - Outcome: Modal opens with empty form, date defaults to today

2. **Form Field Changes:**
   - Action: User types/selects values
   - Outcome: Real-time validation, errors shown inline

3. **Form Submission:**
   - Action: User clicks submit button
   - Outcome:
     - Validate all fields
     - If valid: Show loading state → Optimistic add to list → API call → On success: Keep in list, close modal → On error: Revert, show error message
     - If invalid: Show validation errors, prevent submission

4. **Form Cancel:**
   - Action: User clicks cancel or closes modal
   - Outcome: Modal closes, form state reset

### Activity Editing

1. **Edit Button Click:**
   - Action: Open `ActivityFormModal` in edit mode with activity data
   - Outcome: Modal opens, form pre-filled with activity data

2. **Form Changes and Submission:**
   - Action: Same as creation flow
   - Outcome: Optimistic update (modify in list) → API call (PUT) → On success: Keep changes → On error: Revert to original, show error

### Activity Deletion

1. **Delete Button Click:**
   - Action: Open `DeleteConfirmationModal` with activity info
   - Outcome: Modal opens with confirmation message

2. **Confirmation (Yes):**
   - Action: User clicks "Yes" button
   - Outcome: Optimistic removal from list → API call (DELETE) → On success: Keep removed → On error: Restore to list, show error

3. **Cancellation (No):**
   - Action: User clicks "No" or cancels
   - Outcome: Modal closes, no changes

### Keyboard Navigation

1. **Tab Navigation:**
   - Action: User presses Tab
   - Outcome: Focus moves through interactive elements (buttons, form fields) in logical order

2. **Enter/Space on Buttons:**
   - Action: User presses Enter or Space on focused button
   - Outcome: Button action triggered (same as click)

3. **Escape on Modals:**
   - Action: User presses Escape
   - Outcome: Modal closes (if open)

4. **Arrow Keys in Month Navigation:**
   - Action: User presses Left/Right arrows (when month navigation focused)
   - Outcome: Navigate to previous/next month (optional enhancement)

## 9. Conditions and Validation

### Form Validation (ActivityFormModal)

All validation must match API schema (`createActivityCommandSchema` from `validators.ts`):

1. **activityDate (Required):**
   - Condition: Must be present
   - Validation: Valid ISO-8601 UTC date-time string (e.g., "2025-10-29T12:34:56Z")
   - Error message: "Date is required" or "Date must be in ISO-8601 UTC format"
   - Component: Date picker with validation

2. **duration (Required):**
   - Condition: Must be present
   - Validation:
     - ISO-8601 duration format (PT45M, PT1H30M) OR HH:MM:SS format (00:45:00)
     - Must be greater than 0
   - Error messages:
     - "Duration is required"
     - "Duration must be in ISO-8601 format (PT45M) or HH:MM:SS format (00:45:00)"
     - "Duration must be greater than 0"
   - Component: Duration input with format hint

3. **activityType (Required):**
   - Condition: Must be present
   - Validation: One of "Run", "Walk", "Mixed"
   - Error message: "Activity type is required" or "Activity type must be one of: Run, Walk, Mixed"
   - Component: Radio group or select

4. **distanceMeters (Optional):**
   - Condition: Optional field
   - Validation (if provided):
     - Must be a number
     - Must be >= 0
     - Must have at most 3 decimal places
     - Must not exceed reasonable maximum (e.g., 1000000000)
   - Error messages:
     - "Distance must be a valid number"
     - "Distance must be greater than or equal to 0"
     - "Distance must have at most 3 decimal places"
     - "Distance is too large"
   - Component: Number input with step="0.001" and max attribute

### Month Navigation Validation

1. **Selected Month Range:**
   - Condition: Selected month should be within reasonable range
   - Validation: Optional minDate/maxDate constraints
   - Outcome: Disable navigation buttons if at limits

2. **Current Month Detection:**
   - Condition: Check if selected month is current month
   - Validation: Compare selectedMonth with current month (first day)
   - Outcome: Disable "Today" button if already on current month

### API Response Validation

1. **Activity List Response:**
   - Condition: Response must match `ActivitiesListDto` shape
   - Validation: Check `items` is array, `totalCount` is number
   - Outcome: Handle malformed responses gracefully

2. **Activity Response:**
   - Condition: Single activity response must match `ActivityDto` shape
   - Validation: Check required fields present
   - Outcome: Handle missing fields

### Error State Validation

1. **Network Errors:**
   - Condition: Fetch fails (network error, timeout)
   - Validation: Catch network exceptions
   - Outcome: Show user-friendly error, allow retry

2. **API Error Responses:**
   - Condition: Response status not 2xx
   - Validation: Parse error response body
   - Outcome: Display error message from API, handle specific error codes

## 10. Error Handling

### Network Errors

**Scenario:** Fetch request fails (network error, timeout, CORS)

**Handling:**
- Catch exception in `useActivities` hook
- Set error state: `{ status: 'error', error: 'Network error. Please check your connection.' }`
- Display error banner in `ActivityList` component
- Provide "Retry" button to refetch

**User Experience:**
- Error message: "Unable to load activities. Please check your connection and try again."
- Retry button visible and accessible

### API Error Responses

**400 Bad Request:**
- **Scenario:** Invalid query parameters or malformed request
- **Handling:** Parse error response, display error message
- **User Experience:** Show error: "Invalid request. Please try again."

**401 Unauthorized:**
- **Scenario:** User not authenticated (future implementation)
- **Handling:** Redirect to login page
- **User Experience:** Redirect with message: "Please log in to continue."

**403 Forbidden:**
- **Scenario:** User tries to edit/delete activity they don't own
- **Handling:** Show error message, prevent action
- **User Experience:** Error: "You don't have permission to perform this action."

**404 Not Found:**
- **Scenario:** Activity deleted by another session or doesn't exist
- **Handling:** Remove from list (if in list), show notification
- **User Experience:** Toast/notification: "Activity not found. It may have been deleted."

**422 Unprocessable Entity:**
- **Scenario:** Semantic validation errors (e.g., duration parsing error)
- **Handling:** Parse error details, display field-specific errors
- **User Experience:** Show errors in form fields or error banner

**500 Internal Server Error:**
- **Scenario:** Server-side error
- **Handling:** Show generic error, allow retry
- **User Experience:** Error: "An unexpected error occurred. Please try again." with retry option

### Form Validation Errors

**Scenario:** Client-side validation fails

**Handling:**
- Display errors inline below each field
- Prevent form submission
- Highlight invalid fields (red border, aria-invalid)
- Show error summary at top of form (optional)

**User Experience:**
- Error visible and accessible
- Focus moves to first invalid field on submit attempt
- Clear error messages

### Optimistic Update Failures

**Scenario:** Optimistic update succeeds, but API call fails

**Handling:**
- Revert optimistic change (remove added activity, restore deleted, revert edited)
- Show error message
- Maintain form state if editing (so user can retry)

**User Experience:**
- Activity list reverts to previous state
- Error toast/notification: "Failed to save changes. Please try again."
- Form remains open if editing (user can correct and retry)

### Empty State Handling

**Scenario:** No activities in selected month

**Handling:**
- Display `EmptyState` component
- Show encouraging message
- Provide "Add Activity" call-to-action

**User Experience:**
- Clear message: "No activities in [Month Year]"
- "Start tracking your activities" subheading
- Prominent "Add Activity" button

### Loading State Handling

**Scenario:** Data is being fetched

**Handling:**
- Show `SkeletonLoader` components (3-5 cards)
- Disable navigation buttons during load
- Prevent form submission during load

**User Experience:**
- Skeleton loaders match activity card layout
- Loading indicator (optional spinner)
- Screen reader announcement: "Loading activities"

## 11. Implementation Steps

### Step 1: Setup and Prerequisites

1. Verify required Shadcn/ui components are installed:
   - Button (already installed)
   - Card
   - Dialog
   - AlertDialog
   - Badge
   - DropdownMenu
   - Select (for month/year picker)
   - Input
   - Label
   - Form (optional, can use native form)

2. Install missing components:
   ```bash
   npx shadcn@latest add card dialog alert-dialog badge dropdown-menu select input label
   ```

3. Verify lucide-react icons are available for:
   - ChevronLeft, ChevronRight (month navigation)
   - Plus (add button)
   - Edit, Trash2 (activity actions)
   - Calendar (date picker)
   - Activity (empty state)

### Step 2: Create Type Definitions

1. Add new ViewModel types to `src/types.ts`:
   - `ActivityListState`
   - `GroupedActivities`
   - `ActivityFormState`
   - `ActivityFormErrors`
   - `MonthNavigationState`
   - `ModalStates`

### Step 3: Create Utility Functions

1. Create `src/lib/utils/date.ts`:
   - `formatActivityDate(date: Date): string` - Format date for display
   - `formatDuration(isoDuration: string): string` - Convert ISO-8601 to "1h 30m"
   - `formatDistance(meters: number, unit: DistanceUnit): string` - Convert meters to km/mi
   - `getMonthRange(month: Date): { start: Date, end: Date }` - Get first/last day of month
   - `isToday(date: Date): boolean` - Check if date is today
   - `groupActivitiesByDate(activities: ActivityDto[]): GroupedActivities[]` - Group activities

2. Create `src/lib/utils/validation.ts`:
   - Client-side validation functions matching API schema
   - Reuse validation logic from `validators.ts` where possible

### Step 4: Create Custom Hooks

1. Create `src/components/hooks/useActivities.ts`:
   - Implement activity fetching, creating, updating, deleting
   - Implement optimistic updates
   - Handle errors and retries

2. Create `src/components/hooks/useMonthNavigation.ts`:
   - Implement month selection and navigation logic

3. Create `src/components/hooks/useActivityForm.ts`:
   - Implement form state management
   - Implement validation logic
   - Handle form initialization and reset

### Step 5: Create Layout Component

1. Create `src/layouts/AuthenticatedLayout.astro`:
   - Basic HTML structure
   - Import global CSS
   - Include TopBar component
   - Main content slot

### Step 6: Create TopBar and UserMenu Components

1. Create `src/components/TopBar.tsx` (React):
   - Logo link
   - UserMenu integration
   - Styling with Tailwind

2. Create `src/components/UserMenu.tsx` (React):
   - DropdownMenu from Shadcn/ui
   - User email display
   - Profile link (placeholder)
   - Logout button (placeholder handler)

### Step 7: Create Month Navigation Components

1. Create `src/components/MonthNavigation.tsx` (React):
   - Previous/Next buttons with icons
   - Current month/year display (clickable)
   - "Today" button
   - Sticky positioning

2. Create `src/components/MonthYearPickerModal.tsx` (React):
   - Dialog component
   - Month selector (Select component)
   - Year selector (Select or Input)
   - Confirm/Cancel buttons

### Step 8: Create Activity List Components

1. Create `src/components/ActivityList.tsx` (React):
   - Use `useActivities` hook
   - Handle loading/empty/loaded states
   - Group activities by date
   - Render DateHeader and ActivityCard components

2. Create `src/components/DateHeader.tsx` (React):
   - Format date display
   - "Today" indicator
   - Sticky positioning option

3. Create `src/components/ActivityCard.tsx` (React):
   - Activity type badge (colored)
   - Date/time display
   - Duration display (formatted)
   - Distance display (with unit conversion)
   - Edit/Delete buttons

4. Create `src/components/EmptyState.tsx` (React):
   - Icon/illustration
   - Message with selected month
   - Add Activity button

5. Create `src/components/SkeletonLoader.tsx` (React):
   - Skeleton cards matching ActivityCard layout
   - Configurable count

### Step 9: Create Form and Modal Components

1. Create `src/components/ActivityFormModal.tsx` (React):
   - Dialog component
   - Form with all fields
   - Use `useActivityForm` hook
   - Field-level validation errors
   - Submit/Cancel buttons
   - Handle create and edit modes

2. Create `src/components/DeleteConfirmationModal.tsx` (React):
   - AlertDialog component
   - Confirmation message
   - Activity preview (optional)
   - Yes/No buttons

3. Create `src/components/AddActivityButton.tsx` (React):
   - Button with plus icon
   - Opens ActivityFormModal

### Step 10: Create Main Page

1. Create `src/pages/activities.astro`:
   - Use AuthenticatedLayout
   - Include all React island components
   - Pass default user (DEFAULT_USER_ID) to TopBar
   - Set up client-side state management
   - Handle month selection and activity operations

### Step 11: Implement API Integration

1. Create API client functions in `src/lib/api/activities.client.ts`:
   - `fetchActivities(query: ActivitiesListQuery): Promise<ActivitiesListDto>`
   - `createActivity(command: CreateActivityCommand): Promise<ActivityDto>`
   - `getActivity(id: string): Promise<ActivityDto>`
   - `updateActivity(id: string, command: ReplaceActivityCommand | PatchActivityCommand): Promise<ActivityDto>`
   - `deleteActivity(id: string): Promise<void>`
   - Error handling for all functions

2. Integrate API client into `useActivities` hook

### Step 12: Add Styling and Polish

1. Style all components with Tailwind CSS:
   - Activity type badge colors (Run=blue, Walk=green, Mixed=orange)
   - Hover states on buttons
   - Focus states for accessibility
   - Responsive design (mobile-first)

2. Add animations/transitions:
   - Modal open/close
   - Optimistic update animations
   - Loading state transitions

### Step 13: Implement Accessibility Features

1. Add ARIA labels to all interactive elements
2. Implement keyboard navigation
3. Add focus management for modals
4. Add screen reader announcements for state changes
5. Ensure color contrast meets WCAG AA (4.5:1)
6. Add skip links for keyboard users

### Step 14: Testing and Refinement

1. Test all user interactions:
   - Month navigation
   - Activity creation
   - Activity editing
   - Activity deletion
   - Form validation
   - Error handling

2. Test responsive design on mobile/tablet/desktop

3. Test keyboard navigation

4. Test with screen reader

5. Fix any bugs or UX issues

### Step 15: Documentation

1. Add JSDoc comments to all components and hooks
2. Document prop types and interfaces
3. Add inline comments for complex logic

