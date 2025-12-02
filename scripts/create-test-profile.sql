-- Create profile for E2E test user
INSERT INTO public.profiles (user_id, distance_unit)
VALUES ('5893c20d-0b07-4057-9a00-bb9b14526952', 'km')
ON CONFLICT (user_id) DO NOTHING;
