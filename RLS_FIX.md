# RLS Policy Error Fix

## Problem

When making POST requests to `/api/activities`, you receive the error:

```
Database error: Failed to create activity: new row violates row-level security policy for table "activities"
```

## Root Cause

The `activities` table has Row-Level Security (RLS) enabled with policies that require:
```sql
user_id = auth.uid()
```

The issue occurs because:
1. The API uses `DEFAULT_USER_ID` for development
2. The Supabase client uses the **anon key** which respects RLS policies
3. Without an authenticated session, `auth.uid()` returns `NULL`
4. `NULL != DEFAULT_USER_ID`, so the RLS policy blocks the insert

Even if you run the seed file to create a user in the database, **there's no active session**, so `auth.uid()` is still `NULL`.

## Solution: Use Service Role Key in Development

The fix is to use the **service role key** in development, which bypasses RLS entirely.

### Step 1: Get Your Service Role Key

Start Supabase and get your credentials:

```bash
supabase start
```

After Supabase starts, you'll see output like this:

```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

Copy the **service_role key** (the long JWT token).

### Step 2: Create a `.env` File

Create a `.env` file in your project root:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Important:** The code will automatically use the service role key if it's available, otherwise it falls back to the anon key.

### Step 3: Restart Your Dev Server

```bash
npm run dev
```

### Step 4: Test the API

Now your curl request will work:

```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "Run",
    "activityDate": "2025-01-08T10:00:00Z",
    "duration": "PT45M30S",
    "distanceMeters": 7500
  }'
```

## How It Works

The updated `src/db/supabase.client.ts` now:

```typescript
// Use service role key if available (development), otherwise use anon key (production)
const supabaseKey = supabaseServiceRoleKey || supabaseKey;
```

- **Development:** Uses service role key → bypasses RLS → API works
- **Production:** No service role key set → uses anon key → requires authentication

## Security Notes

⚠️ **CRITICAL SECURITY WARNINGS:**

1. **NEVER commit the service role key to git**
   - The `.env` file is in `.gitignore`
   - Only use service role key in local development

2. **NEVER deploy with service role key in environment variables**
   - Service role key bypasses ALL RLS policies
   - Anyone with this key has full database access

3. **For production:**
   - Remove `SUPABASE_SERVICE_ROLE_KEY` from environment
   - Implement proper user authentication
   - API will automatically use anon key and enforce RLS

## Alternative: Proper Authentication (Production-Ready)

For a production-ready solution, implement authentication in the API:

### 1. Update the API endpoint

Modify `src/pages/api/activities.ts`:

```typescript
// Instead of:
const userId = DEFAULT_USER_ID;

// Use:
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  );
}
const userId = user.id;
```

### 2. Sign up and sign in users

```bash
# Sign up
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Sign in to get access token
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### 3. Use the access token

```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "activityType": "Run",
    "activityDate": "2025-01-08T10:00:00Z",
    "duration": "PT45M30S",
    "distanceMeters": 7500
  }'
```

## Quick Start for Development

**TL;DR - Get it working fast:**

1. Run `supabase start`
2. Copy the service_role key from the output
3. Create `.env`:
   ```
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_KEY=<anon-key-from-supabase-start>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
   ```
4. Run `npm run dev`
5. Test with curl (no authentication needed)

## Troubleshooting

### Error: "Missing environment variables"

Make sure your `.env` file exists and contains all required variables.

### Error: Still getting RLS policy violation

1. Check that `.env` file is in the project root (same directory as `package.json`)
2. Restart your dev server after creating/updating `.env`
3. Verify the service role key is correct (check `supabase start` output)

### How to verify your setup

```bash
# Check Supabase is running
supabase status

# Check your environment variables are loaded
# (in your API, add console.log to verify)
```

## Next Steps

- ✅ Use service role key for local development
- ⏳ Implement proper authentication for production
- ⏳ Remove DEFAULT_USER_ID constant
- ⏳ Update API to require authenticated users
- ⏳ Never deploy with service role key
