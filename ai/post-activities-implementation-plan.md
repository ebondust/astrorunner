# API Endpoint Implementation Plan: POST /api/activities

## 1. Endpoint Overview

The `POST /api/activities` endpoint creates a new activity entry for the authenticated user. This is a core CRUD operation that allows users to log their running, walking, or mixed activities with optional distance tracking. The endpoint validates input data, normalizes duration formats, ensures proper authentication, and returns the created activity resource with a 201 Created status.

**Key Features:**
- Creates user-owned activity entries in the `activities` table
- Validates required fields (`activityDate`, `duration`, `activityType`) and optional `distanceMeters`
- Normalizes duration from ISO-8601 duration format (`PT45M`) or `HH:MM:SS` to PostgreSQL `INTERVAL`
- Enforces authentication via Supabase session (JWT from cookies or Bearer token)
- Automatically associates activity with authenticated user via `auth.uid()` (RLS enforcement)
- Returns created activity in API-friendly format with camelCase field names

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/activities`
- **Content-Type:** `application/json`
- **Authentication:** Required (Supabase JWT session via cookie or `Authorization: Bearer <token>` header)

### Request Body Parameters

**Required:**
- `activityDate` (string): ISO-8601 UTC date-time string (e.g., `"2025-10-29T12:34:56Z"`)
- `duration` (string): Duration in ISO-8601 duration format (e.g., `"PT45M"`) or `HH:MM:SS` format (e.g., `"00:45:00"`)
- `activityType` (string): Enum value - must be one of `"Run"`, `"Walk"`, or `"Mixed"`

**Optional:**
- `distanceMeters` (number): Distance in meters as a decimal number (>= 0, up to 3 decimal places)

### Request Body Example

```json
{
  "activityDate": "2025-10-29T12:34:56Z",
  "duration": "PT45M",
  "activityType": "Run",
  "distanceMeters": 5200.123
}
```

## 3. Used Types

### DTOs and Command Models

From `src/types.ts`:

- **`CreateActivityCommand`** (Request): Input validation model
  - `activityDate: string` - ISO-8601 UTC
  - `duration: string` - ISO-8601 duration or HH:MM:SS
  - `activityType: ActivityType` - "Run" | "Walk" | "Mixed"
  - `distanceMeters?: number` - Optional, >= 0, up to 3 decimals

- **`CreateActivityResponseDto`** (Response): Maps to `ActivityDto`
  - `activityId: string` (UUID)
  - `userId: string` (UUID)
  - `activityDate: string` (ISO-8601 UTC)
  - `duration: string` (ISO-8601 duration format)
  - `activityType: ActivityType`
  - `distanceMeters?: number` (omitted if null)

- **`ActivityType`**: Enum type from database (`"Run" | "Walk" | "Mixed"`)

### Database Entity Types

From `src/db/database.types.ts`:

- **`ActivityInsertEntity`**: Database insert type
  - `activity_id?: string` (auto-generated UUID)
  - `user_id: string` (from auth session)
  - `activity_date: string` (ISO-8601 UTC)
  - `duration: unknown` (PostgreSQL INTERVAL)
  - `activity_type: ActivityType`
  - `distance?: number | null` (meters, NUMERIC(10,3))

## 4. Response Details

### Success Response (201 Created)

**Status Code:** `201 Created`

**Response Body:**

```json
{
  "activityId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "activityDate": "2025-10-29T12:34:56Z",
  "duration": "PT45M",
  "activityType": "Run",
  "distanceMeters": 5200.123
}
```

**Content-Type:** `application/json`

**Response Fields:**
- `activityId` (string, UUID): Generated unique identifier for the activity
- `userId` (string, UUID): ID of the authenticated user who owns the activity
- `activityDate` (string): ISO-8601 UTC timestamp of the activity
- `duration` (string): ISO-8601 duration format (normalized from input)
- `activityType` (string): One of "Run", "Walk", or "Mixed"
- `distanceMeters` (number, optional): Distance in meters (only included if provided and not null)

### Error Responses

See **Error Handling** section below for detailed error scenarios and status codes.

## 5. Data Flow

1. **Request Reception**
   - Astro API route handler at `src/pages/api/activities.ts` receives POST request
   - Middleware (`src/middleware/index.ts`) has already attached Supabase client to `context.locals.supabase`

2. **Authentication Verification**
   - Extract Supabase client from `context.locals.supabase`
   - Get authenticated user session via `supabase.auth.getUser()` or `supabase.auth.getSession()`
   - If no session exists, return `401 Unauthorized`
   - Extract `userId` from session: `session.user.id` or `user.id`

3. **Request Body Parsing**
   - Parse JSON request body using `await context.request.json()`
   - Validate `Content-Type` is `application/json` (if not, return `400 Bad Request`)

4. **Input Validation**
   - Use Zod schema to validate request body against `CreateActivityCommand`
   - Validate `activityDate` is valid ISO-8601 UTC date-time
   - Validate `duration` is valid ISO-8601 duration or `HH:MM:SS` format and > 0
   - Validate `activityType` is one of `"Run" | "Walk" | "Mixed"`
   - Validate `distanceMeters` (if provided) is >= 0 and has max 3 decimal places
   - On validation failure, return `400 Bad Request` with validation error details

5. **Duration Normalization**
   - Parse duration string (ISO-8601 or HH:MM:SS) and convert to PostgreSQL `INTERVAL` type
   - Use utility function in `src/lib` (e.g., `src/lib/validators.ts` or `src/lib/duration.ts`)
   - Ensure duration is > 0 (reject zero or negative durations)

6. **Data Transformation**
   - Transform API command (`CreateActivityCommand`) to database entity (`ActivityInsertEntity`)
   - Map `activityDate` (ensure UTC timezone)
   - Map `duration` (converted to INTERVAL)
   - Map `activityType` (enum value)
   - Map `distanceMeters` to `distance` (null if not provided)
   - Set `user_id` from authenticated session (never from client input)

7. **Database Insert**
   - Call service method in `src/lib/services/activity.service.ts` (or create if doesn't exist)
   - Service method uses authenticated Supabase client to insert into `activities` table
   - RLS policy (`own_activity_access`) ensures user can only insert with their own `user_id`
   - Database generates `activity_id` via `gen_random_uuid()`

8. **Response Mapping**
   - Transform database entity to API DTO (`ActivityDto`)
   - Map `activity_id` → `activityId`
   - Map `user_id` → `userId`
   - Map `activity_date` → `activityDate` (ISO-8601 UTC string)
   - Map `duration` (INTERVAL) → ISO-8601 duration string format
   - Map `activity_type` → `activityType`
   - Map `distance` → `distanceMeters` (only if not null)

9. **Response Return**
   - Return `201 Created` status with JSON body containing `ActivityDto`
   - Set `Content-Type: application/json` header

## 6. Security Considerations

### Authentication
- **Mechanism:** Supabase Auth with JWT-based sessions
- **Implementation:**
  - Verify session via `supabase.auth.getUser()` or `supabase.auth.getSession()`
  - Support both cookie-based (SSR) and `Authorization: Bearer <token>` header (SPA) authentication
  - Session must be valid and not expired
- **Failure:** Return `401 Unauthorized` if no valid session

### Authorization
- **User Ownership:** `user_id` is derived from authenticated session (`auth.uid()`)
- **RLS Enforcement:** Row-Level Security policy `own_activity_access` on `activities` table ensures users can only insert activities with their own `user_id`
- **Client Input Rejection:** Never accept `userId` or `user_id` from client request body; always derive from session
- **Database-Level Protection:** RLS policies prevent unauthorized access even if application logic fails

### Input Validation
- **Zod Schema Validation:** Use Zod to validate and sanitize all input fields
- **Type Safety:** Enforce `ActivityType` enum values (reject invalid values)
- **Date Validation:** Validate ISO-8601 format and ensure valid date-time
- **Duration Validation:** Validate format and ensure > 0 (reject zero/negative)
- **Distance Validation:** If provided, must be >= 0 and precision limited to 3 decimals
- **Malformed JSON:** Return `400 Bad Request` for invalid JSON syntax

### Data Sanitization
- **SQL Injection Prevention:** Use Supabase client parameterized queries (built-in protection)
- **XSS Prevention:** Store data as-is (no HTML rendering in API layer)
- **No PII in Logs:** Avoid logging sensitive user data (use correlation IDs for error tracking)

### Rate Limiting
- **Middleware-Based:** Apply rate limiting in `src/middleware/index.ts`
- **Limit:** 60 requests per minute per IP/user (sliding window)
- **Response:** Return `429 Too Many Requests` when limit exceeded

### HTTPS Enforcement
- **Production:** Enforce HTTPS at hosting/proxy level (not in application code)
- **Cookies:** Use secure, httpOnly, sameSite cookies for session management

## 7. Error Handling

### Error Response Format

All error responses should follow a consistent structure:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {} // Optional, for validation errors
}
```

### Error Scenarios and Status Codes

1. **400 Bad Request - Invalid Input**
   - **Cause:** Malformed JSON, missing required fields, invalid data types, or validation failures
   - **Examples:**
     - Missing `activityDate`, `duration`, or `activityType`
     - Invalid `activityDate` format (not ISO-8601)
     - Invalid `duration` format or duration <= 0
     - Invalid `activityType` (not "Run", "Walk", or "Mixed")
     - `distanceMeters` < 0 or has more than 3 decimal places
   - **Response Body:**
     ```json
     {
       "error": "ValidationError",
       "message": "Invalid input data",
       "details": {
         "field": "duration",
         "reason": "Duration must be greater than 0"
       }
     }
     ```

2. **401 Unauthorized - Authentication Required**
   - **Cause:** No valid Supabase session (missing, expired, or invalid token)
   - **Response Body:**
     ```json
     {
       "error": "Unauthorized",
       "message": "Authentication required"
     }
     ```
   - **Note:** Do not reveal specific authentication failure reasons (security best practice)

3. **422 Unprocessable Entity - Semantic Validation Error**
   - **Cause:** Valid JSON but semantically invalid (e.g., date in future beyond reason, duration format valid but cannot be parsed)
   - **Response Body:**
     ```json
     {
       "error": "UnprocessableEntity",
       "message": "Unable to process the request",
       "details": {
         "field": "duration",
         "reason": "Unable to parse duration format"
       }
     }
     ```

4. **500 Internal Server Error**
   - **Cause:** Database connection failure, unexpected server error, or unhandled exception
   - **Response Body:**
     ```json
     {
       "error": "InternalServerError",
       "message": "An unexpected error occurred",
       "correlationId": "uuid-for-logging"
     }
     ```
   - **Logging:** Log full error with correlation ID server-side; never expose stack traces to client

### Error Handling Implementation

- **Early Returns:** Use guard clauses and early returns for error conditions
- **Try-Catch Blocks:** Wrap database operations and external calls in try-catch
- **Error Logging:** Log server errors with correlation IDs for troubleshooting
- **User-Friendly Messages:** Provide clear, actionable error messages without exposing internal details
- **Consistent Format:** Use standardized error response structure across all endpoints

## 8. Performance Considerations

### Database Operations
- **Indexes:** Primary index on `activity_id` (auto-generated) supports fast lookups
- **Composite Index:** `idx_user_activities_list` on `(user_id, activity_date DESC)` optimizes list queries (not directly used for insert, but beneficial for subsequent reads)
- **RLS Overhead:** RLS policies add minimal overhead; ensure proper indexing on `user_id`

### Validation Performance
- **Zod Parsing:** Zod validation is fast; consider caching compiled schemas if needed
- **Duration Parsing:** Duration normalization should be efficient; avoid multiple parsing passes

### Network and Response
- **Response Size:** Keep response payload small (single activity object)
- **JSON Serialization:** Use efficient JSON serialization (built-in `JSON.stringify` is sufficient)

### Scalability
- **Connection Pooling:** Supabase handles connection pooling automatically
- **Rate Limiting:** Implement rate limiting to prevent abuse and ensure fair resource usage
- **Async Operations:** Use async/await for non-blocking I/O operations

### Potential Bottlenecks
- **Database Write:** Single INSERT operation is typically fast; monitor for connection pool exhaustion under high load
- **Authentication Check:** Session verification adds minimal latency; cache session info if needed (Supabase handles this)

## 9. Implementation Steps

### Step 1: Create Validation Utilities

**File:** `src/lib/validators.ts` (create if doesn't exist)

- Create Zod schema for `CreateActivityCommand` validation
- Create utility function `parseDuration(duration: string): string` to normalize duration (ISO-8601 or HH:MM:SS → INTERVAL-compatible format)
- Create utility function `validateIsoDate(dateString: string): Date` to validate ISO-8601 UTC dates
- Create utility function `validateDistance(distance?: number): number | null` to validate and round distance to 3 decimals

**Dependencies:**
- `zod` package (install if not present)
- Duration parsing library (e.g., `iso8601-duration` or custom parser)

### Step 2: Create Activity Service

**File:** `src/lib/services/activity.service.ts` (create if doesn't exist)

- Create service class or module with `createActivity` method
- Method signature: `createActivity(supabase: SupabaseClient, userId: string, command: CreateActivityCommand): Promise<ActivityEntity>`
- Handle database insert operation
- Transform `CreateActivityCommand` to `ActivityInsertEntity`
- Map duration to PostgreSQL INTERVAL format
- Return inserted activity entity

**Dependencies:**
- `src/db/supabase.client.ts` for SupabaseClient type
- `src/types.ts` for type definitions

### Step 3: Create Mapping Utilities

**File:** `src/lib/mappers/activity.mapper.ts` (create if doesn't exist)

- Create `mapCommandToEntity(command: CreateActivityCommand, userId: string): ActivityInsertEntity`
- Create `mapEntityToDto(entity: ActivityEntity): ActivityDto`
- Handle duration conversion (INTERVAL → ISO-8601 duration string)
- Handle null distance (omit from DTO if null)

### Step 4: Create Authentication Helper

**File:** `src/lib/auth.ts` (create if doesn't exist)

- Create `getAuthenticatedUser(supabase: SupabaseClient): Promise<{ id: string }>`
- Extract user from Supabase session
- Handle both cookie and Bearer token authentication
- Throw or return null for unauthenticated requests (let endpoint handle 401 response)

### Step 5: Implement API Route Handler

**File:** `src/pages/api/activities.ts`

- Export `export const prerender = false` for SSR
- Implement `POST` handler function
- Steps in handler:
  1. Get Supabase client from `context.locals.supabase`
  2. Get authenticated user via `getAuthenticatedUser()` → return 401 if not authenticated
  3. Parse and validate request body with Zod schema
  4. Normalize duration using utility function
  5. Validate all fields (early returns for errors)
  6. Call `activityService.createActivity()` with validated data
  7. Map entity to DTO using mapper
  8. Return `201 Created` with JSON response

**Error Handling:**
- Wrap in try-catch for 500 errors
- Return appropriate status codes (400, 401, 422, 500)
- Log errors with correlation IDs

### Step 6: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

- Ensure Supabase client is properly attached to `context.locals.supabase`
- Add session verification helper if needed
- Consider adding request logging for API routes

### Step 7: Add Error Response Utilities

**File:** `src/lib/api/errors.ts` (create if doesn't exist)

- Create standardized error response functions:
  - `badRequest(message: string, details?: object): Response`
  - `unauthorized(message?: string): Response`
  - `unprocessableEntity(message: string, details?: object): Response`
  - `internalServerError(correlationId: string): Response`
- Ensure consistent error response format

### Step 8: Testing

- **Unit Tests:** Test validation utilities, mappers, and service methods
- **Integration Tests:** Test API endpoint with mock Supabase client
- **E2E Tests:** Test full flow with test database (optional)

### Step 9: Documentation

- Update API documentation (if separate doc exists)
- Add JSDoc comments to public functions
- Document error codes and response formats

### Step 10: Code Review Checklist

- [ ] All validation rules implemented
- [ ] Authentication properly enforced
- [ ] Error handling covers all scenarios
- [ ] Response format matches specification
- [ ] Type safety maintained throughout
- [ ] No security vulnerabilities (no client-provided user_id, etc.)
- [ ] Logging implemented for errors
- [ ] Code follows project structure and conventions

