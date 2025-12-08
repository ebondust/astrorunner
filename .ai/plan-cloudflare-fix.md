# Plan: Fix HTTP 500 Error on Cloudflare Pages

## Root Cause Analysis

The HTTP 500 error is caused by **Node.js-specific `crypto` module imports** that don't work in Cloudflare Workers runtime.

### Critical Issue: `node:crypto` imports

Cloudflare Workers use a Web-standard runtime (V8 isolates), NOT Node.js. The following files import from `node:crypto` which fails at runtime:

| File | Line | Code |
|------|------|------|
| `src/pages/api/activities.ts` | 2 | `import { randomUUID } from "node:crypto"` |
| `src/pages/api/activities/[id].ts` | 2 | `import { randomUUID } from "node:crypto"` |

Additionally, these files use `crypto.randomUUID()` which works in Workers but is inconsistent:
- `src/pages/api/auth/signup.ts` (lines 87, 94)
- `src/pages/api/auth/logout.ts` (line 31)

## Solution

Replace Node.js `crypto` module with Web Crypto API which is available in both Node.js 19+ and Cloudflare Workers.

### Changes Required

#### 1. `src/pages/api/activities.ts`
**Before:**
```typescript
import { randomUUID } from "node:crypto";
```

**After:**
```typescript
// Remove the import - use globalThis.crypto.randomUUID() directly
```

Then replace all `randomUUID()` calls with `crypto.randomUUID()`.

#### 2. `src/pages/api/activities/[id].ts`
Same change as above.

#### 3. Verification
The auth files already use `crypto.randomUUID()` without the Node.js import, which is the correct pattern for Cloudflare Workers compatibility.

## Why This Works

- `crypto.randomUUID()` is part of the Web Crypto API
- Available globally in:
  - Node.js 19+ (as `globalThis.crypto`)
  - Cloudflare Workers
  - Modern browsers
- No import needed - it's a global

## Implementation Steps

1. Remove `import { randomUUID } from "node:crypto"` from:
   - `src/pages/api/activities.ts`
   - `src/pages/api/activities/[id].ts`

2. Replace `randomUUID()` calls with `crypto.randomUUID()` in those files

3. Rebuild and redeploy

## Risk Assessment

- **Low risk**: This is a straightforward API change
- **No breaking changes**: Both environments support `crypto.randomUUID()`
- **Testing**: Run `npm run build` with `CF_PAGES=1` locally to verify build succeeds

## Alternative Considered

Could use `@astrojs/cloudflare` with `nodejs_compat` flag, but this adds complexity and is not recommended for simple cases like UUID generation.
