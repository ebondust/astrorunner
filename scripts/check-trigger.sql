-- Check if the trigger exists
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'on_auth_user_created';

-- Check if the function exists
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'handle_new_user';
