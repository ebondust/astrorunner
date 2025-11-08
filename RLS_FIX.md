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

The API endpoint uses a `DEFAULT_USER_ID` (`00000000-0000-0000-0000-000000000000`) for development, but when making unauthenticated API calls:
- `auth.uid()` returns `NULL`
- `NULL != DEFAULT_USER_ID`
- RLS policy blocks the insert

## Solution

There are two ways to fix this:

### Option 1: Use the Seed File (Recommended for Local Development)

The `supabase/seed.sql` file creates a test user with the `DEFAULT_USER_ID`. This allows the API to work in development mode while keeping RLS policies secure.

**Steps:**

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. The seed file runs automatically. If you need to re-run it:
   ```bash
   supabase db reset
   ```

3. Now you can make unauthenticated POST requests and they will work:
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

**How it works:**
- The seed file creates a user in `auth.users` with ID `00000000-0000-0000-0000-000000000000`
- Creates a profile for that user
- When the API inserts an activity with `user_id = DEFAULT_USER_ID`, the RLS policy check passes because:
  - The Supabase client is configured with the anon key
  - The user exists in the database
  - The profile exists, so the foreign key constraint is satisfied

### Option 2: Authenticate with a Real User

For production-like testing, authenticate properly:

1. **Sign up a user:**
   ```bash
   curl -X POST 'YOUR_SUPABASE_URL/auth/v1/signup' \
     -H "apikey: YOUR_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "secure_password"
     }'
   ```

2. **Sign in to get an access token:**
   ```bash
   curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
     -H "apikey: YOUR_SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "secure_password"
     }'
   ```

3. **Update the API endpoint** to use the authenticated user:
   - Modify `src/pages/api/activities.ts`
   - Replace `const userId = DEFAULT_USER_ID;` with:
     ```typescript
     const { data: { user }, error: authError } = await supabase.auth.getUser();
     if (authError || !user) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
     }
     const userId = user.id;
     ```

4. **Use the token in your request:**
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

## Understanding the RLS Policies

The migration file `20251026232655_create_activity_logger_schema.sql` creates these RLS policies:

```sql
-- Users can only insert activities for themselves
create policy "own_activity_insert" on activities
    for insert
    to authenticated
    with check (user_id = auth.uid());
```

This ensures:
1. Only authenticated users can create activities
2. Users can only create activities for themselves (not for other users)
3. The `user_id` must match their authentication token

## Test User Credentials

The seed file creates a test user:
- **Email:** `test@example.com`
- **Password:** `testpassword123`
- **User ID:** `00000000-0000-0000-0000-000000000000`

**WARNING:** This is for LOCAL DEVELOPMENT ONLY. Never use this in production.

## Verifying the Fix

After running the seed file, you should see:
- 1 user in the `auth.users` table
- 1 profile in the `profiles` table
- 3 sample activities in the `activities` table

You can verify with:
```bash
# Check the user exists
supabase db psql -c "SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';"

# Check the profile exists
supabase db psql -c "SELECT * FROM profiles WHERE user_id = '00000000-0000-0000-0000-000000000000';"

# Check the activities exist
supabase db psql -c "SELECT count(*) FROM activities WHERE user_id = '00000000-0000-0000-0000-000000000000';"
```

## Next Steps

For production deployment:
1. Remove the `DEFAULT_USER_ID` constant
2. Implement proper authentication in the API endpoints
3. Use the authenticated user's ID from the session
4. Never commit or deploy the seed file to production
