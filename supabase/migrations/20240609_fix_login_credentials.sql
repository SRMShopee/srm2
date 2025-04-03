-- Update the test user to ensure email and driver_id match exactly
UPDATE auth.users
SET email = 'test123'
WHERE email = 'test123';

-- Ensure the driver_id in the users table matches the email in auth.users
UPDATE public.users
SET driver_id = 'test123'
WHERE driver_id ILIKE 'test123';
