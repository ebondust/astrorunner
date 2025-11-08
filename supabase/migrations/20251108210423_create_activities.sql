-- Migration: Create activities table
-- Purpose: Store user activity data (runs, walks) with date, duration, and optional distance
-- Affected tables: activities
-- Security: Implements Row Level Security (RLS) to ensure users can only access their own activities

-- Create the activities table
create table if not exists public.activities (
  -- Primary key
  id uuid default gen_random_uuid() primary key,

  -- Foreign key to auth.users
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Activity data
  activity_type text not null,
  activity_date timestamptz not null,
  duration interval not null,
  distance_meters numeric(10, 2),

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add index on user_id for better query performance
create index if not exists idx_activities_user_id on public.activities(user_id);

-- Add index on activity_date for better query performance when filtering by date
create index if not exists idx_activities_date on public.activities(activity_date);

-- Enable Row Level Security
alter table public.activities enable row level security;

-- RLS Policy: Allow authenticated users to select their own activities
-- This policy ensures users can only view activities they created
create policy "authenticated_users_select_own_activities"
  on public.activities
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own activities
-- This policy ensures users can only create activities for themselves
create policy "authenticated_users_insert_own_activities"
  on public.activities
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own activities
-- This policy ensures users can only modify activities they created
create policy "authenticated_users_update_own_activities"
  on public.activities
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own activities
-- This policy ensures users can only delete activities they created
create policy "authenticated_users_delete_own_activities"
  on public.activities
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Deny anonymous users from selecting activities
-- Anonymous users should not be able to view any activities
create policy "anon_users_cannot_select_activities"
  on public.activities
  for select
  to anon
  using (false);

-- RLS Policy: Deny anonymous users from inserting activities
-- Anonymous users should not be able to create activities
create policy "anon_users_cannot_insert_activities"
  on public.activities
  for insert
  to anon
  with check (false);

-- RLS Policy: Deny anonymous users from updating activities
-- Anonymous users should not be able to modify activities
create policy "anon_users_cannot_update_activities"
  on public.activities
  for update
  to anon
  using (false);

-- RLS Policy: Deny anonymous users from deleting activities
-- Anonymous users should not be able to delete activities
create policy "anon_users_cannot_delete_activities"
  on public.activities
  for delete
  to anon
  using (false);

-- Create function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at on activity updates
create trigger set_updated_at
  before update on public.activities
  for each row
  execute function public.handle_updated_at();
