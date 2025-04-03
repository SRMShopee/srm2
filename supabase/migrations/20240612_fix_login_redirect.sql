-- Update the test user to ensure email and driver_id match exactly
UPDATE auth.users
SET email = 'test123'
WHERE email ILIKE 'test123';

-- Ensure the driver_id in the users table matches the email in auth.users
UPDATE public.users
SET driver_id = 'test123'
WHERE driver_id ILIKE 'test123';

-- Make sure the admin user has the correct email and driver_id
UPDATE auth.users
SET email = 'admin@shopee.com'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.users
SET driver_id = 'admin@shopee.com'
WHERE id = '11111111-1111-1111-1111-111111111111';
