-- First completely delete all users to start fresh
DROP TABLE IF EXISTS public.driver_regions;

-- Truncate tables to ensure they're completely empty
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE auth.users CASCADE;

-- Create users with explicit UUIDs
DO $$
DECLARE
  admin_id UUID := gen_random_uuid(); -- Generate random UUID instead of hardcoded
  driver_id UUID := gen_random_uuid(); -- Generate random UUID instead of hardcoded
BEGIN
  -- Create admin user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    admin_id,
    'admin',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}'
  );
  
  -- Create driver user
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    driver_id,
    '441255',
    crypt('warcraft', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"driver"}'
  );

  -- Insert into public.users table for admin
  INSERT INTO public.users (id, name, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  VALUES (
    admin_id,
    'Administrador',
    'admin',
    'admin',
    admin_id,
    admin_id,
    now(),
    'N/A',
    'N/A',
    'TODOS'
  );

  -- Insert into public.users table for driver
  INSERT INTO public.users (id, name, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  VALUES (
    driver_id,
    'Entregador 441255',
    '441255',
    'driver',
    driver_id,
    driver_id,
    now(),
    'UTILITARIO',
    'QNU7D48',
    'CAMPO BOM / RS'
  );

  -- Output the created IDs for reference
  RAISE NOTICE 'Created admin with ID: %', admin_id;
  RAISE NOTICE 'Created driver with ID: %', driver_id;
END
$$;

-- Run this migration
SELECT 'Migration completed successfully' as status;