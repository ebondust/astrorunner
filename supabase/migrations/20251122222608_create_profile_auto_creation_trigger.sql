-- Migration: Auto-create profile on user signup
-- Purpose: Automatically create a profiles record when a new user signs up in auth.users
-- Affected Tables: profiles
-- Special Considerations: This trigger ensures every user has a profile with default preferences
--
-- Created: 2025-11-22 (UTC)

-- Function to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Insert a new profile with default distance unit preference
  insert into public.profiles (user_id, distance_unit)
  values (new.id, 'km');

  return new;
exception
  when others then
    -- Log error but don't fail the signup process
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Create trigger to call the function after user signup
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add comment explaining the trigger
comment on function public.handle_new_user() is 'Automatically creates a profile record with default preferences when a new user signs up';
