# CLAUDE.md - AI Assistant Guide for AstroRunner

This document provides comprehensive guidance for AI assistants (like Claude) working on the AstroRunner codebase. It covers the project structure, conventions, development workflows, and key architectural patterns.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Development Workflows](#development-workflows)
6. [Code Conventions](#code-conventions)
7. [Database Schema](#database-schema)
8. [API Patterns](#api-patterns)
9. [Testing Strategy](#testing-strategy)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**AstroRunner** (also known as Activity Logger) is a minimalist, web-based tool for tracking and viewing personal run and walk activities. The application focuses on simplicity, security, and mobile-first design.

### Key Features

- Activity tracking (runs, walks, mixed activities)
- User authentication and authorization
- Historical activity viewing with filtering
- AI-powered motivational messages (via OpenRouter)
- Mobile-first responsive design
- GDPR compliance and Row Level Security (RLS)

### Project Status

- **Current Version**: 0.0.1
- **Phase**: MVP Development
- **Node Version**: 22.14.0 (see `.nvmrc`)

---

## Tech Stack

### Frontend

- **Astro 5** - Static site generator with server-side rendering
- **React 19** - Interactive components (islands architecture)
- **TypeScript 5** - Type safety across the codebase
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Accessible React component library (Radix UI)

### Backend

- **Astro SSR** - Server-side rendering with Node adapter
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth)
- **OpenRouter** - AI service for motivational messages

### Development Tools

- **ESLint 9** - Code linting with TypeScript, React, Astro plugins
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **Zod** - Runtime validation

---

## Project Structure

```
/home/user/astrorunner/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn/ui components (Button, Card, etc.)
│   │   ├── hooks/          # React hooks (useActivities, useMonthNavigation)
│   │   └── *.tsx           # Feature components
│   ├── pages/              # Astro pages (routes)
│   │   ├── api/            # API endpoints (Server-Side)
│   │   │   ├── activities.ts
│   │   │   └── motivation/
│   │   ├── activities.astro
│   │   └── index.astro
│   ├── layouts/            # Astro layouts
│   │   ├── Layout.astro
│   │   └── AuthenticatedLayout.astro
│   ├── lib/                # Business logic
│   │   ├── services/       # Service layer (activity, openrouter)
│   │   ├── mappers/        # DTO ↔ Entity mappings
│   │   ├── api/            # Client-side API helpers
│   │   ├── utils/          # Utility functions
│   │   └── validators.ts   # Zod schemas and validation
│   ├── db/                 # Database client and types
│   │   ├── supabase.client.ts
│   │   └── database.types.ts (generated from Supabase)
│   ├── middleware/         # Astro middleware
│   │   └── index.ts        # Injects Supabase client
│   ├── styles/             # Global CSS
│   │   └── global.css
│   ├── types.ts            # Shared TypeScript types (DTOs, Commands)
│   ├── frontend-types.ts   # Frontend-specific types
│   └── env.d.ts            # TypeScript environment declarations
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── .ai/                    # AI tooling config (Cursor, etc.)
├── .claude/                # Claude-specific config
├── .cursor/                # Cursor-specific config
├── .github/                # GitHub Actions workflows
├── astro.config.mjs        # Astro configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
├── .prettierrc.json        # Prettier configuration
├── components.json         # Shadcn/ui configuration
├── package.json            # Dependencies and scripts
└── README.md               # User-facing documentation

```

---

## Architecture Patterns

### 1. Islands Architecture (Astro)

- **Static by default**: Astro pages are static HTML
- **Hydration on demand**: React components use `client:*` directives
  - `client:load` - Hydrate immediately
  - `client:idle` - Hydrate when main thread is idle
  - `client:visible` - Hydrate when component enters viewport

### 2. Layered Architecture

```
┌─────────────────────────────────────┐
│  Pages (.astro) / Components (.tsx) │  ← Presentation Layer
├─────────────────────────────────────┤
│  API Routes (/api/*.ts)             │  ← API Layer (Server)
├─────────────────────────────────────┤
│  Services (/lib/services/*.ts)     │  ← Business Logic
├─────────────────────────────────────┤
│  Mappers (/lib/mappers/*.ts)       │  ← Data Transformation
├─────────────────────────────────────┤
│  Database (Supabase Client)        │  ← Data Layer
└─────────────────────────────────────┘
```

### 3. Separation of Concerns

#### Types (src/types.ts)

- **Entities**: Database types from `database.types.ts` (e.g., `ActivityEntity`)
- **DTOs**: API-facing types (e.g., `ActivityDto`)
- **Commands**: Input types for mutations (e.g., `CreateActivityCommand`)
- **Queries**: Input types for list operations (e.g., `ActivitiesListQuery`)

#### Mappers (src/lib/mappers/)

- Transform between database entities and DTOs
- **Entity → DTO**: `mapEntityToDto(entity)` - Used when returning data from API
- **Command → Entity**: `mapCommandToEntity(command, userId)` - Used when inserting data

#### Services (src/lib/services/)

- Pure business logic functions
- Accept Supabase client + validated input
- Return entities or throw errors
- **Never trust user input** - Always validate first

#### Validators (src/lib/validators.ts)

- Zod schemas for input validation
- Reusable validation functions (e.g., `validateIsoDate`, `parseDuration`)

### 4. API Conventions

#### Endpoint Structure

```
GET    /api/activities        - List activities (with filters)
POST   /api/activities        - Create activity
GET    /api/activities/[id]   - Get single activity (future)
PUT    /api/activities/[id]   - Replace activity (future)
PATCH  /api/activities/[id]   - Update activity (future)
DELETE /api/activities/[id]   - Delete activity (future)
```

#### Request/Response Flow

1. **Parse request** (query params, JSON body)
2. **Validate input** (Zod schema)
3. **Authenticate user** (currently uses `DEFAULT_USER_ID`)
4. **Call service** (business logic)
5. **Map to DTO** (using mappers)
6. **Return JSON response** (with appropriate status code)

#### Error Handling

- Use helper functions from `src/lib/api/errors.ts`:
  - `badRequest(message, details?)` → 400
  - `unprocessableEntity(message, details?)` → 422
  - `internalServerError(correlationId)` → 500
- Always log errors with correlation IDs for traceability

### 5. Database Patterns

#### Supabase Client Usage

- **ALWAYS use `context.locals.supabase`** in API routes and Astro pages
- **NEVER import `supabaseClient` directly** in API routes - it's injected via middleware
- **Use `SupabaseClient` type** from `src/db/supabase.client.ts`, NOT from `@supabase/supabase-js`
- The Supabase client is injected via middleware in `src/middleware/index.ts`

Example:
```typescript
// ✅ CORRECT - In API routes
export async function GET(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;
  // ... use supabase
}

// ❌ INCORRECT - Don't do this in API routes
import { supabaseClient } from "../../db/supabase.client";
```

#### Row Level Security (RLS)

- **ALL tables have RLS enabled**
- Users can only access their own data: `user_id = auth.uid()`
- Never bypass RLS in application code
- RLS policies should be **granular**: separate policies for `select`, `insert`, `update`, `delete`
- Each policy should be specific to a Supabase role (`anon`, `authenticated`)

#### Naming Conventions

- **Database**: snake_case (e.g., `activity_date`, `user_id`)
- **TypeScript/API**: camelCase (e.g., `activityDate`, `userId`)
- Mappers handle the conversion

---

## Development Workflows

### Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and OpenRouter credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

### Available Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server (port 3000)     |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint                               |
| `npm run lint:fix`| Auto-fix ESLint issues                   |
| `npm run format`  | Format code with Prettier                |

### Git Workflow

1. **Before committing**:
   - Husky runs `lint-staged` automatically
   - Lints: `*.{ts,tsx,astro}` with ESLint
   - Formats: `*.{json,css,md}` with Prettier

2. **Commit message conventions**:
   - Keep concise and descriptive
   - Follow existing patterns in `git log`

### Adding New Features

#### Adding a New API Endpoint

1. Create file in `src/pages/api/` (e.g., `src/pages/api/stats.ts`)
2. Export `GET`, `POST`, etc. functions
3. Set `export const prerender = false;`
4. Follow error handling patterns from existing endpoints
5. Use correlation IDs for tracking

#### Adding a New Service Function

1. Create or update file in `src/lib/services/` (e.g., `activity.service.ts`)
2. Accept `SupabaseClient` as first parameter
3. Validate inputs thoroughly
4. Return entities (not DTOs)
5. Throw descriptive errors on failure

#### Adding a New React Component

1. Create in `src/components/` (e.g., `MyComponent.tsx`)
2. Use TypeScript for props
3. Follow existing patterns (hooks, state management)
4. Use Shadcn/ui components from `src/components/ui/`
5. Import utilities from `src/lib/utils.ts` (e.g., `cn()` for class merging)

#### Adding a New Database Migration

1. Use Supabase CLI:
   ```bash
   supabase migration new migration_name
   ```

2. **Migration file naming convention**:
   - Format: `YYYYMMDDHHmmss_short_description.sql`
   - Use UTC time for timestamp
   - Example: `20240906123045_create_profiles.sql`

3. Write migration in `supabase/migrations/` following these guidelines:
   - Include header comment with metadata (purpose, affected tables, special considerations)
   - Write all SQL in lowercase
   - Add thorough comments explaining each step
   - Add copious comments for destructive commands (truncate, drop, column alterations)

4. Always include:
   - Clear comments explaining changes
   - **MUST enable RLS** on all new tables (even for public access)
   - RLS policies for new tables (granular: one per operation and role)
   - Indexes for performance
   - Include comments explaining rationale for each RLS policy

5. Test migration locally before pushing

---

## Code Conventions

### TypeScript

- **Strict mode enabled** (`extends: "astro/tsconfigs/strict"`)
- **Always use explicit types** for function parameters and return values
- **Use interfaces for DTOs**, type aliases for unions/utility types
- **Import types with `type` keyword**: `import type { Foo } from './types'`

### Naming Conventions

| Context        | Convention    | Example                     |
| -------------- | ------------- | --------------------------- |
| Files          | kebab-case    | `activity-form-modal.tsx`   |
| Components     | PascalCase    | `ActivityFormModal`         |
| Functions      | camelCase     | `createActivity`            |
| Variables      | camelCase     | `activityDate`              |
| Constants      | UPPER_SNAKE   | `DEFAULT_USER_ID`           |
| Types/DTOs     | PascalCase    | `ActivityDto`               |
| Database       | snake_case    | `activity_date`             |

### File Organization

- **Imports order**:
  1. External packages (React, Astro, etc.)
  2. Internal absolute imports (`@/...`)
  3. Relative imports (`./`, `../`)
- **Group related code**: Keep services, mappers, validators together
- **Single responsibility**: Each file should have one clear purpose

### React Conventions

- **Functional components only** (no class components)
- **NEVER use "use client"** or other Next.js directives (this is Astro + React, not Next.js)
- **Use hooks** from `src/components/hooks/`
- **Extract logic into custom hooks** in `src/components/hooks/`
- **Props interfaces**: Define inline or export if reused
- **Event handlers**: Prefix with `handle` (e.g., `handleSubmit`)
- **Client-side only code**: Use `client:*` directives in Astro pages

#### React Performance Optimizations

- Use `React.memo()` for expensive components that render often with the same props
- Use `React.lazy()` and `Suspense` for code-splitting and performance optimization
- Use `useCallback` for event handlers passed to child components to prevent unnecessary re-renders
- Use `useMemo` for expensive calculations to avoid recomputation on every render
- Use `useId()` for generating unique IDs for accessibility attributes
- Use `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

### Astro Conventions

- **Props**: Define with TypeScript interface
- **Frontmatter**: Logic goes in `---` section
- **SEO**: Always include `<title>` and `<meta>` tags
- **Layout**: Use layouts from `src/layouts/`
- **View Transitions**: Leverage View Transitions API for smooth page transitions
- **Content Collections**: Use with type safety for blog posts, documentation, etc.
- **Server Endpoints**: Use for API routes in `src/pages/api/`
- **Environment Variables**: Access via `import.meta.env`

#### Astro API Routes

- **Use UPPERCASE format** for endpoint handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- **Always set `export const prerender = false`** for API routes (disables static prerendering)
- **Use Zod for input validation** in all API routes
- **Extract business logic into services** in `src/lib/services/`
- **Implement middleware** for request/response modification (see `src/middleware/index.ts`)

Example:
```typescript
// src/pages/api/example.ts
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const supabase = context.locals.supabase;
  // ... validation, service calls, response
}
```

### Styling

- **Tailwind classes**: Use utility classes directly
- **Component variants**: Use `class-variance-authority` (cva)
- **Class merging**: Use `cn()` from `src/lib/utils.ts`
- **Global styles**: Add to `src/styles/global.css` (sparingly)
- **Use @layer directive** to organize styles into components, utilities, and base layers
- **Arbitrary values**: Use square brackets for precise one-off designs (e.g., `w-[123px]`)
- **Dark mode**: Use the `dark:` variant for dark mode styles
- **Responsive design**: Use responsive variants (`sm:`, `md:`, `lg:`, etc.)
- **State variants**: Use `hover:`, `focus-visible:`, `active:` for interactive elements

#### Shadcn/ui Components

Components are located in `src/components/ui/` and use the "new-york" style variant with "neutral" base color.

To install additional Shadcn components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add accordion
```

**Important**: Use `npx shadcn@latest`, NOT `npx shadcn-ui@latest` (deprecated)

Available components include: accordion, alert, alert-dialog, avatar, calendar, checkbox, command, context-menu, data-table, date-picker, dropdown-menu, form, hover-card, menubar, navigation-menu, popover, progress, radio-group, scroll-area, separator, sheet, skeleton, slider, switch, table, textarea, sonner (toast), toggle, tooltip, and more.

### Accessibility (ARIA)

- **Use ARIA landmarks** to identify page regions (main, navigation, search)
- **Apply ARIA roles** to custom elements lacking semantic HTML equivalents
- **Use `aria-expanded` and `aria-controls`** for expandable content (accordions, dropdowns)
- **Implement `aria-live` regions** with appropriate politeness for dynamic updates
- **Use `aria-hidden`** to hide decorative or duplicative content from screen readers
- **Apply `aria-label` or `aria-labelledby`** for elements without visible text labels
- **Use `aria-describedby`** to associate descriptive text with form inputs
- **Implement `aria-current`** for indicating current item in navigation or process
- **Avoid redundant ARIA** that duplicates native HTML element semantics

### Comments

- **JSDoc for functions**: Include `@param`, `@returns`, `@throws`
- **Inline comments**: Explain "why", not "what"
- **TODO comments**: Use `// TODO: description` for future work
- **Do NOT create new markdown files** to document each change or summarize your work unless specifically requested by the user

### Error Handling and Clean Code Guidelines

- **Prioritize error handling and edge cases** at the beginning of functions
- **Handle errors and edge cases early** - Use guard clauses and early returns
- **Place the happy path last** in the function for improved readability
- **Avoid unnecessary else statements** - Use if-return pattern instead
- **Use guard clauses** to handle preconditions and invalid states early
- **Avoid deeply nested if statements** - Early returns improve readability
- **Implement proper error logging** with correlation IDs for traceability
- **Use custom error types** or error factories for consistent error handling
- **Provide user-friendly error messages** - Never expose internal details to users

Example of preferred error handling pattern:

```typescript
async function processActivity(data: unknown): Promise<ActivityDto> {
  // 1. Guard clauses and validation first
  if (!data) {
    throw new Error("Activity data is required");
  }

  const validationResult = activitySchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError("Invalid activity data");
  }

  // 2. More guard clauses
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // 3. Happy path last
  const activity = await createActivity(supabase, userId, validationResult.data);
  return mapEntityToDto(activity);
}
```

---

## Database Schema

### Tables

#### `profiles`

Stores user settings and preferences.

| Column         | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `user_id`      | uuid   | PK, FK to `auth.users`, CASCADE    |
| `distance_unit`| text   | User's distance preference (km/mi) |

#### `activities`

Stores logged runs and walks.

| Column          | Type        | Description                                  |
| --------------- | ----------- | -------------------------------------------- |
| `activity_id`   | uuid        | PK, auto-generated                           |
| `user_id`       | uuid        | FK to `profiles.user_id`, CASCADE            |
| `activity_date` | timestamptz | Activity date/time (UTC)                     |
| `duration`      | interval    | Activity duration (PostgreSQL INTERVAL)      |
| `activity_type` | enum        | "Run", "Walk", or "Mixed"                    |
| `distance`      | numeric(10,3)| Optional distance in meters                 |

### Enums

- **`activity_type`**: `'Run' | 'Walk' | 'Mixed'`

### Indexes

- `idx_user_activities_list` on `(user_id, activity_date DESC)` - Optimizes activity list queries

### Row Level Security (RLS)

All tables have RLS policies restricting access to authenticated users' own data:

```sql
-- Example RLS policy
create policy "own_activity_select" on activities
    for select
    to authenticated
    using (user_id = auth.uid());
```

**IMPORTANT**: Never disable RLS or bypass it in application code.

---

## API Patterns

### Authentication

**Current State**: Authentication is not yet implemented. API endpoints use `DEFAULT_USER_ID` constant.

**Future**: Will use Supabase Auth (`auth.uid()`) extracted from session token.

### Request Validation

All API endpoints follow this pattern:

```typescript
// 1. Validate Content-Type
const contentType = context.request.headers.get("content-type");
if (!contentType?.includes("application/json")) {
  return badRequest("Content-Type must be application/json");
}

// 2. Parse JSON body
let requestBody: unknown;
try {
  requestBody = await context.request.json();
} catch (error) {
  return badRequest("Invalid JSON");
}

// 3. Validate with Zod
const result = createActivityCommandSchema.safeParse(requestBody);
if (!result.success) {
  return badRequest("Invalid input", { validationErrors: result.error.errors });
}

const validatedCommand = result.data;
```

### Response Format

#### Success Response

```typescript
{
  // ... DTO fields
}
```

#### List Response

```typescript
{
  items: ActivityDto[],
  nextCursor: string | null,
  totalCount: number
}
```

#### Error Response

```typescript
{
  error: {
    message: string,
    correlationId?: string,
    details?: object
  }
}
```

### Status Codes

| Code | Meaning                | When to Use                              |
| ---- | ---------------------- | ---------------------------------------- |
| 200  | OK                     | Successful GET, PATCH, DELETE            |
| 201  | Created                | Successful POST                          |
| 400  | Bad Request            | Invalid JSON, wrong Content-Type         |
| 422  | Unprocessable Entity   | Validation failed                        |
| 500  | Internal Server Error  | Unexpected errors, database failures     |

---

## Testing Strategy

### Current State

- **Manual testing** during development
- **Type checking** with TypeScript
- **Linting** with ESLint

### Future Improvements

- Add unit tests for services and mappers
- Add integration tests for API endpoints
- Add E2E tests for critical user flows

### Testing Recommendations

When implementing tests:

1. **Services**: Mock Supabase client, test business logic
2. **Mappers**: Test entity ↔ DTO transformations
3. **Validators**: Test Zod schemas with valid/invalid inputs
4. **API Routes**: Test with mock requests, verify responses
5. **Components**: Test rendering and user interactions

**IMPORTANT - Testing Mappers**: Before writing mapper tests, always check the actual implementation to verify data formats:
- `parseDuration()` returns PostgreSQL INTERVAL word format (e.g., "45 minutes", "1 hour 30 minutes"), NOT "HH:MM:SS"
- Test assertions must match the actual output format, not assumed formats

---

## Common Tasks

### Adding a New Activity Field

1. **Update database migration**:
   - Add column to `activities` table
   - Update RLS policies if needed

2. **Regenerate types**:
   ```bash
   supabase gen types typescript --local > src/db/database.types.ts
   ```

3. **Update TypeScript types** (`src/types.ts`):
   - Add field to `ActivityDto`
   - Add field to `CreateActivityCommand`

4. **Update validators** (`src/lib/validators.ts`):
   - Add Zod validation for new field

5. **Update mappers** (`src/lib/mappers/activity.mapper.ts`):
   - Handle new field in `mapEntityToDto`
   - Handle new field in `mapCommandToEntity`

6. **Update UI components**:
   - Add input field to `ActivityFormModal.tsx`
   - Display field in `ActivityCard.tsx`

### Debugging Supabase Issues

1. **Check RLS policies**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM activities WHERE user_id = 'your-user-id';
   ```

2. **Check user authentication**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

3. **Enable detailed error logging**:
   - Check browser console for client errors
   - Check server logs (`npm run dev`) for API errors

### Adding Environment Variables

1. **Add to `.env.example`** with placeholder:
   ```bash
   NEW_VAR=###
   ```

2. **Add to `src/env.d.ts`**:
   ```typescript
   interface ImportMetaEnv {
     readonly NEW_VAR: string;
   }
   ```

3. **Access in code**:
   ```typescript
   const value = import.meta.env.NEW_VAR;
   ```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

#### TypeScript Errors After Database Changes

```bash
# Regenerate database types
supabase gen types typescript --local > src/db/database.types.ts
```

#### ESLint/Prettier Conflicts

- The project uses `eslint-config-prettier` to disable conflicting rules
- If conflicts persist, check `.prettierrc.json` and `eslint.config.js`

#### Supabase Connection Errors

1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`
2. Verify Supabase project is running (local or cloud)
3. Check network connectivity
4. Review RLS policies (may be blocking access)

#### OpenRouter API Errors

1. Verify `OPENROUTER_API_KEY` in `.env`
2. Check OpenRouter API status
3. Review logs for rate limiting or quota issues
4. Fallback message system activates automatically on failure

---

## Important Security Notes

### NEVER Do These

- ❌ Disable RLS on tables
- ❌ Expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ❌ Trust user input without validation
- ❌ Use `DEFAULT_USER_ID` in production
- ❌ Log sensitive user data (passwords, tokens)
- ❌ Commit `.env` file to git

### ALWAYS Do These

- ✅ Validate all inputs with Zod
- ✅ Use RLS for data access control
- ✅ Sanitize error messages sent to clients
- ✅ Use correlation IDs for error tracking
- ✅ Hash/encrypt sensitive data
- ✅ Keep dependencies updated

---

## Additional Resources

### Documentation Links

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Zod Documentation](https://zod.dev)

### Internal References

- **Product Requirements**: See `README.md`
- **Database Migrations**: `supabase/migrations/`
- **Type Definitions**: `src/types.ts`, `src/db/database.types.ts`
- **API Endpoints**: `src/pages/api/`

---

## Updates and Maintenance

### When to Update This Document

- Adding new architectural patterns
- Changing development workflows
- Adding new conventions or best practices
- Major refactoring or structural changes
- Security updates or policy changes

### Document Version

- **Last Updated**: 2025-11-21
- **Maintained By**: Development Team
- **Status**: Living Document

---

## Quick Reference

### Most Common File Locations

```
src/types.ts                           # All DTOs, Commands, Types
src/lib/validators.ts                  # Zod schemas
src/lib/services/activity.service.ts   # Activity business logic
src/lib/mappers/activity.mapper.ts     # Entity ↔ DTO mappings
src/pages/api/activities.ts            # Activity API endpoints
src/components/ActivitiesPageContainer.tsx  # Main activity page
src/db/supabase.client.ts              # Supabase client setup
.env.example                           # Environment variables template
```

### Most Common Commands

```bash
npm run dev          # Start development
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run build        # Build for production
```

---

This document should be your primary reference when working on the AstroRunner codebase. If you notice gaps or outdated information, please update this file to keep it current.
