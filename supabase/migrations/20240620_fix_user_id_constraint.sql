-- Fix user creation by properly handling the ID column

-- First, let's clean up any failed attempts
DELETE FROM auth.users WHERE email = 'driver1' AND id IS NULL;
DELETE FROM auth.users WHERE email = 'admin' AND id IS NULL;

-- Create admin user with explicit UUID
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users with explicit UUID
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
  VALUES (
    admin_uuid,
    'admin',
    crypt('password123', gen_salt('bf')),
    now(),
    'authenticated',
    '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Insert into public.users with the same UUID
  INSERT INTO public.users (id, email, role)
  VALUES (
    admin_uuid,
    'admin',
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Create driver user with explicit UUID
DO $$
DECLARE
  driver_uuid UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users with explicit UUID
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
  VALUES (
    driver_uuid,
    'driver1',
    crypt('password123', gen_salt('bf')),
    now(),
    'authenticated',
    '{"provider": "email", "providers": ["email"], "role": "driver"}'::jsonb
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Insert into public.users with the same UUID
  INSERT INTO public.users (id, email, role)
  VALUES (
    driver_uuid,
    'driver1',
    'driver'
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Enable realtime for users table
alter publication supabase_realtime add table public.users;