# Supabase Setup Guide

This guide explains how to set up Supabase for the Activity Logger application and fix the RLS (Row-Level Security) policy error.

## Prerequisites

1. Have Supabase CLI installed: `npm install -g supabase`
2. Have a Supabase project created (local or remote)
3. Environment variables configured in `.env`

## Environment Setup

Create a `.env` file in the root directory:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Database Migration

Run the migration to create the activities table with proper RLS policies:

```bash
# For local Supabase
supabase db reset

# For remote Supabase
supabase db push
```

Or manually run the migration file at `supabase/migrations/20251108210423_create_activities.sql` in your Supabase SQL editor.

## Understanding the RLS Policy Error

The error "new row violates row-level security policy for table 'activities'" occurs because:

1. The `activities` table has Row-Level Security enabled
2. RLS policies require an authenticated user to create activities
3. The curl request you're using doesn't include authentication

## How to Fix: Authenticate Your Requests

### Option 1: Create a User and Get an Auth Token

1. **Sign up a user** (if you haven't already):

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_secure_password"
  }'
```

2. **Sign in to get an access token**:

```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_secure_password"
  }'
```

This will return a response with an `access_token`.

3. **Use the access token in your activities request**:

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

### Option 2: Use Supabase Client Directly

For testing, you can use the Supabase JavaScript client:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your_secure_password',
})

// Create activity (automatically uses the authenticated session)
const { data: activity, error: activityError } = await supabase
  .from('activities')
  .insert({
    activity_type: 'Run',
    activity_date: '2025-01-08T10:00:00Z',
    duration: 'PT45M30S',
    distance_meters: 7500,
  })
```

## RLS Policies Explained

The migration creates the following RLS policies:

1. **Authenticated users** can:
   - SELECT their own activities
   - INSERT activities (with their user_id)
   - UPDATE their own activities
   - DELETE their own activities

2. **Anonymous users** cannot:
   - Perform any operations on activities

This ensures that:
- Users can only see and manage their own data
- All activities must be associated with an authenticated user
- The `user_id` is automatically set from the authenticated session

## API Endpoints

### POST /api/activities

Create a new activity (requires authentication).

**Request:**
```json
{
  "activityType": "Run",
  "activityDate": "2025-01-08T10:00:00Z",
  "duration": "PT45M30S",
  "distanceMeters": 7500
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "activity_type": "Run",
  "activity_date": "2025-01-08T10:00:00Z",
  "duration": "PT45M30S",
  "distance_meters": 7500,
  "created_at": "2025-01-08T10:00:00Z",
  "updated_at": "2025-01-08T10:00:00Z"
}
```

### GET /api/activities

Get all activities for the authenticated user.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "activity_type": "Run",
    "activity_date": "2025-01-08T10:00:00Z",
    "duration": "PT45M30S",
    "distance_meters": 7500,
    "created_at": "2025-01-08T10:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
]
```

## Troubleshooting

### Error: "You must be logged in to create activities"

This means the API endpoint couldn't find an authenticated user. Make sure you:
1. Have a valid session/token
2. Include the `Authorization: Bearer TOKEN` header
3. Your Supabase client is properly configured

### Error: "new row violates row-level security policy"

This error occurs at the database level when:
1. The RLS policies haven't been applied (run the migration)
2. The `user_id` doesn't match the authenticated user's ID
3. The request is unauthenticated

### Error: "Missing required fields"

Make sure your request includes:
- `activityType` (string)
- `activityDate` (ISO 8601 timestamp)
- `duration` (ISO 8601 duration format)
- `distanceMeters` (optional, number)
