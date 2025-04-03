-- Add driver_id column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver';

-- Create index on driver_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_driver_id ON public.users(driver_id);

-- Create admin user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@shopee.delivery') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      gen_random_uuid(),
      'admin@shopee.delivery',
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"driver_id":"admin","role":"admin"}'
    );
  END IF;
END
$$;

-- Create driver user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'driver441255@shopee.delivery') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      gen_random_uuid(),
      'driver441255@shopee.delivery',
      crypt('warcraft', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"driver_id":"441255","role":"driver"}'
    );
  END IF;
END
$$;

-- Insert into public.users table for admin
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@shopee.delivery';
  
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@shopee.delivery') AND admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, name, email, driver_id, role, user_id, token_identifier, created_at)
    VALUES (
      admin_id,
      'Admin',
      'admin@shopee.delivery',
      'admin',
      'admin',
      admin_id,
      admin_id,
      now()
    );
  END IF;
END
$$;

-- Insert into public.users table for driver
DO $$
DECLARE
  driver_id uuid;
BEGIN
  SELECT id INTO driver_id FROM auth.users WHERE email = 'driver441255@shopee.delivery';
  
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'driver441255@shopee.delivery') AND driver_id IS NOT NULL THEN
    INSERT INTO public.users (id, name, email, driver_id, role, user_id, token_identifier, created_at)
    VALUES (
      driver_id,
      'Driver 441255',
      'driver441255@shopee.delivery',
      '441255',
      'driver',
      driver_id,
      driver_id,
      now()
    );
  END IF;
END
$$;

-- Enable realtime for users table
alter publication supabase_realtime add table users;