-- Fix user creation by properly handling the ID column and email conflicts

-- First, let's clean up any failed attempts
DELETE FROM auth.users WHERE email = 'driver1' AND id IS NULL;
DELETE FROM auth.users WHERE email = 'admin' AND id IS NULL;

-- Create admin user with explicit UUID
DO $$
DECLARE
  admin_uuid UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Check if admin user already exists
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin') INTO admin_exists;
  
  IF admin_exists THEN
    -- Get existing admin UUID
    SELECT id INTO admin_uuid FROM auth.users WHERE email = 'admin';
  ELSE
    -- Generate new UUID
    admin_uuid := gen_random_uuid();
    
    -- Insert into auth.users with explicit UUID
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
    VALUES (
      admin_uuid,
      'admin',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb
    );
  END IF;
  
  -- Insert or update public.users with the same UUID
  INSERT INTO public.users (id, email, role, token_identifier, created_at, updated_at)
  VALUES (
    admin_uuid,
    'admin',
    'admin',
    'admin_token_' || admin_uuid::text,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    token_identifier = EXCLUDED.token_identifier,
    updated_at = now();
 END;
$$;

-- Create driver user with explicit UUID
DO $$
DECLARE
  driver_uuid UUID;
  driver_exists BOOLEAN;
BEGIN
  -- Check if driver user already exists
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'driver1') INTO driver_exists;
  
  IF driver_exists THEN
    -- Get existing driver UUID
    SELECT id INTO driver_uuid FROM auth.users WHERE email = 'driver1';
  ELSE
    -- Generate new UUID
    driver_uuid := gen_random_uuid();
    
    -- Insert into auth.users with explicit UUID
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
    VALUES (
      driver_uuid,
      'driver1',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider": "email", "providers": ["email"], "role": "driver"}'::jsonb
    );
  END IF;
  
  -- Insert or update public.users with the same UUID
  INSERT INTO public.users (id, email, role, token_identifier, created_at, updated_at)
  VALUES (
    driver_uuid,
    'driver1',
    'driver',
    'driver_token_' || driver_uuid::text,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    token_identifier = EXCLUDED.token_identifier,
    updated_at = now();
END;
$$;

-- Enable realtime for users table
alter publication supabase_realtime add table public.users;