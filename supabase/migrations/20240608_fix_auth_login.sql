-- Update the test user to ensure it works with the login system
UPDATE auth.users
SET email = 'test123', 
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"driver"}'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Ensure the public.users table has the correct driver_id
UPDATE public.users
SET driver_id = 'test123'
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Remove the line that was causing the error
-- The users table is already part of the realtime publication
