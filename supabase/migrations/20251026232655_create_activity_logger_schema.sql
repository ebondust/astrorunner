-- =====================================================
-- Migration: Create Activity Logger Database Schema
-- Purpose: Initialize tables, types, indexes, and RLS policies for activity tracking
-- Affected Tables: profiles, activities
-- Special Considerations: 
--   - Uses auth.users table (Supabase managed)
--   - Implements custom activity_type ENUM
--   - Enables RLS on all custom tables
--   - Creates performance indexes for user activity queries
-- =====================================================

-- Create custom ENUM type for activity categories
-- This defines the three valid activity types: Run, Walk, Mixed
create type activity_type as enum ('Run', 'Walk', 'Mixed');

-- =====================================================
-- Table: profiles
-- Purpose: Stores user-specific application settings
-- Relationship: One-to-one extension of auth.users table
-- =====================================================

create table profiles (
    -- Primary key linking to Supabase auth.users table
    user_id uuid primary key references auth.users(id) on delete cascade,
    
    -- User's preferred distance unit (km or miles)
    -- Defaults to kilometers for international consistency
    distance_unit text not null default 'km' check (distance_unit in ('km', 'mi'))
);

-- Enable Row Level Security on profiles table
-- This ensures users can only access their own profile data
alter table profiles enable row level security;

-- RLS Policy: Allow authenticated users to select their own profile
-- This policy ensures users can only read their own profile data
create policy "own_profile_select" on profiles
    for select
    to authenticated
    using (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to insert their own profile
-- This policy allows new users to create their profile after registration
create policy "own_profile_insert" on profiles
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to update their own profile
-- This policy allows users to modify their profile settings (e.g., distance unit)
create policy "own_profile_update" on profiles
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to delete their own profile
-- This policy allows users to delete their profile (cascades to activities)
create policy "own_profile_delete" on profiles
    for delete
    to authenticated
    using (user_id = auth.uid());

-- =====================================================
-- Table: activities
-- Purpose: Stores all logged running and walking activities
-- Relationship: Many-to-one with profiles table
-- =====================================================

create table activities (
    -- Primary key using UUID for security and non-sequential identifiers
    activity_id uuid primary key default gen_random_uuid(),
    
    -- Foreign key linking to user's profile
    -- Cascades deletion when user profile is deleted
    user_id uuid not null references profiles(user_id) on delete cascade,
    
    -- Activity date and time stored in UTC for consistency
    -- This ensures proper timezone handling across different user locations
    activity_date timestamp with time zone not null,
    
    -- Activity duration using PostgreSQL INTERVAL type
    -- Allows proper time span storage and aggregation
    duration interval not null check (duration > interval '0 minutes'),
    
    -- Activity type using custom ENUM for data integrity
    activity_type activity_type not null,
    
    -- Optional distance in meters for precision
    -- Stored as NUMERIC(10,3) for high precision (up to 9,999,999.999 meters)
    distance numeric(10, 3) check (distance >= 0)
);

-- Enable Row Level Security on activities table
-- This ensures users can only access their own activity data
alter table activities enable row level security;

-- RLS Policy: Allow authenticated users to select their own activities
-- This policy ensures users can only read their own activity data
create policy "own_activity_select" on activities
    for select
    to authenticated
    using (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to insert their own activities
-- This policy allows users to log new activities
create policy "own_activity_insert" on activities
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to update their own activities
-- This policy allows users to modify their existing activities
create policy "own_activity_update" on activities
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- RLS Policy: Allow authenticated users to delete their own activities
-- This policy allows users to remove their activities
create policy "own_activity_delete" on activities
    for delete
    to authenticated
    using (user_id = auth.uid());

-- =====================================================
-- Performance Indexes
-- Purpose: Optimize common query patterns for better performance
-- =====================================================

-- Index for efficient user activity list queries
-- This index optimizes fetching a user's activities sorted by date (most recent first)
-- Composite index on (user_id, activity_date DESC) covers both filtering and sorting
create index idx_user_activities_list on activities (user_id, activity_date desc);

-- =====================================================
-- Migration Complete
-- 
-- Summary of created objects:
-- - Custom type: activity_type (ENUM)
-- - Table: profiles (with RLS policies)
-- - Table: activities (with RLS policies)
-- - Index: idx_user_activities_list (performance optimization)
-- 
-- Security: All tables have RLS enabled with user-specific access policies
-- Performance: Index created for efficient user activity queries
-- Data Integrity: CHECK constraints prevent invalid data entry
-- =====================================================
