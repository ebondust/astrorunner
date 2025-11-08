-- =====================================================
-- Seed File: Development User Setup
-- Purpose: Create a default test user for local development
-- =====================================================

-- Insert a test user into auth.users with the DEFAULT_USER_ID
-- This allows the API to work in development mode without full authentication
-- Password: testpassword123
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test@example.com',
    -- This is the encrypted version of 'testpassword123'
    -- Generated using Supabase's default bcrypt settings
    '$2a$10$pL5mVOuSKlZi7r.VmCHd1O6Fz9pO.9C0j3nV8nXP0Xr8O9M0F1G2O',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create a profile for the test user
INSERT INTO public.profiles (user_id, distance_unit)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'km'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert some sample activities for testing
INSERT INTO public.activities (
    user_id,
    activity_date,
    duration,
    activity_type,
    distance
)
VALUES
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2025-01-08 10:00:00+00'::timestamptz,
        '00:45:30'::interval,
        'Run'::activity_type,
        7500
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2025-01-07 08:30:00+00'::timestamptz,
        '00:30:00'::interval,
        'Walk'::activity_type,
        3000
    ),
    (
        '00000000-0000-0000-0000-000000000000'::uuid,
        '2025-01-06 16:00:00+00'::timestamptz,
        '01:15:00'::interval,
        'Run'::activity_type,
        12000
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- Seed Complete
--
-- Summary:
-- - Created test user: test@example.com (password: testpassword123)
-- - User ID: 00000000-0000-0000-0000-000000000000
-- - Created profile with distance_unit = 'km'
-- - Added 3 sample activities for testing
--
-- Note: This seed file is for LOCAL DEVELOPMENT ONLY
-- DO NOT run this on production databases
-- =====================================================
