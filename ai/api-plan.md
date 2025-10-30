# REST API Plan

## 1. Resources

- profiles → table: `profiles`
- activities → table: `activities`
- auth/session → managed by Supabase Auth (`auth.users`), consumed by API via JWT/session cookies

Notes
- Row-Level Security (RLS) is enabled; all queries must scope by `auth.uid()`.
- Primary indexes: `profiles(user_id)`, `activities(activity_id)`; composite index: `activities(user_id, activity_date DESC)` for list queries.

## 2. Endpoints

Conventions
- All endpoints are prefixed with `/api`.
- Request/response content type: `application/json`.
- Timestamps use ISO-8601 in UTC (e.g., `2025-10-29T12:34:56Z`).
- Durations use ISO-8601 duration (e.g., `PT45M`) or `HH:MM:SS` string; server normalizes to interval.
- Distance stored in meters as decimal.
- Authentication: Supabase session (JWT) via cookies or `Authorization: Bearer <token>` header.

### 2.1 Auth (Supabase-backed)

While auth is primarily handled client-side via Supabase SDK, minimal pass-through endpoints are provided for SSR flows or server-only interactions.

1) POST /api/auth/signup
- Description: Create a new user account (delegates to Supabase Auth).
- Request
```
{
  "email": "string",
  "password": "string"
}
```
- Response (201)
```
{
  "userId": "uuid",
  "email": "string"
}
```
- Errors: 400 invalid input, 409 email exists, 500 server error.

2) POST /api/auth/login
- Description: Log in and set secure session cookie (delegates to Supabase Auth).
- Request
```
{
  "email": "string",
  "password": "string"
}
```
- Response (200)
```
{
  "userId": "uuid",
  "email": "string"
}
```
- Errors: 400 invalid input, 401 invalid credentials, 500 server error.

3) POST /api/auth/logout
- Description: Invalidate session (clears cookie / revokes token).
- Request: none
- Response (204): no body
- Errors: 401 not authenticated, 500 server error.

4) POST /api/auth/password-reset
- Description: Start password reset flow (sends email via Supabase Auth).
- Request
```
{
  "email": "string"
}
```
- Response (202): accepted
- Errors: 400 invalid input, 404 user not found (optional generic 202), 500 server error.

Notes
- Production apps should rely on Supabase-hosted auth endpoints where possible; these endpoints are optional shims to support SSR/edge flows.

### 2.2 Profiles

Resource: the authenticated user’s profile and preference(s).

Schema
```
Profile {
  userId: uuid,
  distanceUnit: "km" | "mi"
}
```

1) GET /api/profile
- Description: Get authenticated user profile.
- Query params: none
- Response (200)
```
{
  "userId": "uuid",
  "distanceUnit": "km" | "mi"
}
```
- Errors: 401 not authenticated, 404 if profile missing (can be auto-created on signup), 500 server error.

2) PUT /api/profile
- Description: Create or replace the authenticated user profile (upsert semantics).
- Request
```
{
  "distanceUnit": "km" | "mi"
}
```
- Response (200)
```
{
  "userId": "uuid",
  "distanceUnit": "km" | "mi"
}
```
- Errors: 400 invalid `distanceUnit`, 401 not authenticated, 500 server error.

3) PATCH /api/profile
- Description: Partially update profile fields.
- Request
```
{
  "distanceUnit": "km" | "mi"
}
```
- Response (200): same as GET
- Errors: 400 invalid input, 401, 500.

### 2.3 Activities

Resource: user-owned run/walk/mixed activity entries.

Schema
```
Activity {
  activityId: uuid,
  userId: uuid,
  activityDate: string (ISO-8601 UTC),
  duration: string (ISO-8601 duration or HH:MM:SS),
  activityType: "Run" | "Walk" | "Mixed",
  distanceMeters?: number (>= 0, up to 3 decimal places)
}
```

1) GET /api/activities
- Description: List activities for authenticated user.
- Default sort: `activityDate` DESC.
- Pagination: cursor or page-based.
- Query parameters
  - `limit` (number, default 20, max 100)
  - `cursor` (string; opaque, for cursor-based pagination)
  - or `page` (number, default 1) and `pageSize` (number, default 20, max 100)
  - `from` (ISO date, inclusive)
  - `to` (ISO date, inclusive)
  - `type` (Run|Walk|Mixed)
  - `hasDistance` (true|false)
  - `sort` (field: `activityDate`|`duration`|`distance`; default `activityDate`)
  - `order` (`asc`|`desc`; default `desc`)
- Response (200)
```
{
  "items": [
    {
      "activityId": "uuid",
      "activityDate": "2025-10-29T12:34:56Z",
      "duration": "PT45M",
      "activityType": "Run",
      "distanceMeters": 5200.123
    }
  ],
  "nextCursor": "string|null",
  "totalCount": 123
}
```
- Errors: 401 not authenticated, 400 invalid filters, 500 server error.

2) POST /api/activities
- Description: Create a new activity (owned by authenticated user).
- Request
```
{
  "activityDate": "2025-10-29T12:34:56Z",
  "duration": "PT45M" | "00:45:00",
  "activityType": "Run" | "Walk" | "Mixed",
  "distanceMeters": 5200.123
}
```
- Response (201)
```
{
  "activityId": "uuid",
  "activityDate": "2025-10-29T12:34:56Z",
  "duration": "PT45M",
  "activityType": "Run",
  "distanceMeters": 5200.123
}
```
- Errors: 400 validation error (required fields, duration > 0, distance >= 0), 401, 500.

3) GET /api/activities/{activityId}
- Description: Get one activity by id (must belong to user).
- Response (200): same shape as POST response
- Errors: 401, 403 forbidden (not owner), 404 not found, 500.

4) PUT /api/activities/{activityId}
- Description: Replace an activity.
- Request: same as POST (all required fields provided)
- Response (200): activity resource
- Errors: 400 validation, 401, 403, 404, 500.

5) PATCH /api/activities/{activityId}
- Description: Partially update an activity.
- Request
```
{
  "activityDate"?: "ISO-8601",
  "duration"?: "PT.." | "HH:MM:SS",
  "activityType"?: "Run" | "Walk" | "Mixed",
  "distanceMeters"?: number
}
```
- Response (200): activity resource
- Errors: 400 validation, 401, 403, 404, 500.

6) DELETE /api/activities/{activityId}
- Description: Delete an activity (idempotent). UI should confirm before calling.
- Response (204): no body
- Errors: 401, 403, 404, 500.

### 2.4 Deferred (Phase 2) Endpoints

1) GET /api/activities/calendar
- Description: Calendar highlighting days with ≥1 activity within a month.
- Query: `month=YYYY-MM` (required)
- Response (200)
```
{
  "month": "2025-10",
  "days": [
    { "date": "2025-10-01", "hasActivity": true, "count": 2 },
    { "date": "2025-10-02", "hasActivity": false, "count": 0 }
  ]
}
```

2) GET /api/activities/stats
- Description: Aggregated stats for a period; exclude entries without distance from distance totals.
- Query: `from`, `to`, `type` optional
- Response (200)
```
{
  "period": { "from": "2025-10-01", "to": "2025-10-31" },
  "totals": {
    "run": { "duration": "PT5H", "distanceMeters": 21000.5 },
    "walk": { "duration": "PT3H", "distanceMeters": 8000.0 },
    "mixed": { "duration": "PT2H", "distanceMeters": 5000.0 }
  }
}
```

## 3. Authentication and Authorization

- Mechanism: Supabase Auth with JWT-based sessions; RLS enforces user ownership in the database.
- Implementation
  - API verifies session via Supabase server client using cookie or bearer token.
  - No `userId` is accepted from client payloads; it is derived from the authenticated session (`auth.uid()`).
  - All database operations include an authenticated Supabase client to respect RLS.
- Session Storage: Use Supabase cookies (httpOnly, secure, sameSite) for SSR; or headers for SPA.
- Authorization: Ownership checks handled by RLS; API additionally ensures resource `user_id` matches `auth.uid()` when reading by id.

## 4. Validation and Business Logic

Profiles
- distanceUnit: must be one of `km`, `mi`.

Activities
- Required: `activityDate`, `duration`, `activityType`.
- `duration` > 0 (reject 0 or negative). Normalize to interval.
- `activityType` enum: `Run` | `Walk` | `Mixed`.
- `distanceMeters` optional; if provided, must be `>= 0` and precision up to 3 decimals.
- `activityDate` must be a valid ISO-8601 date-time; stored in UTC.
- Ownership: `user_id` is derived from session; not provided by client.

List / Filtering
- Use composite index `(user_id, activity_date DESC)` for performant list queries with ordering.
- Server applies default order by `activity_date DESC`.
- Cursor pagination preferred for large lists; page-based supported for simplicity.

Business Logic
- Delete confirmation is a UI concern; API `DELETE` remains idempotent and final.
- Phase 2 statistics must exclude entries without distance from distance totals and respect filters.

Security
- HTTPS enforced at hosting/proxy level.
- Rate limiting: apply middleware-based limits per IP/user (e.g., 60 req/min) with sliding window.
- Input validation: reject malformed payloads with 400/422; never echo sensitive details.
- Error messages: generic for auth errors (e.g., "Invalid credentials").
- Logging: log server errors with correlation IDs; avoid logging PII.
- GDPR/RODO: store minimal personal data; rely on Supabase’s secure password hashing and session management.

Responses and Error Codes
- Success: 200 OK, 201 Created, 202 Accepted, 204 No Content.
- Client errors: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests.
- Server errors: 500 Internal Server Error.

Notes for Implementation (Astro + TypeScript)
- Place handlers under `src/pages/api/*` with typed request/response models in `src/types.ts`.
- Use `@supabase/supabase-js` server client from `src/db/supabase.client.ts` with RLS.
- Middleware `src/middleware/index.ts` to parse auth cookies, enforce HTTPS in production, and apply rate limits.
- Validate inputs centrally in small utility functions in `src/lib` (e.g., duration parser, ISO date guard).


