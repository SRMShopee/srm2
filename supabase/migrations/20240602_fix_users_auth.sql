-- Fix the users table to properly handle driver IDs

-- Update the auth.users table to use driver_id as the email
DO $$
BEGIN
  -- Delete existing users to recreate them properly
  DELETE FROM auth.users WHERE email IN ('admin@shopee.delivery', 'driver441255@shopee.delivery');
  
  -- Create admin user with driver ID as the identifier
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'admin',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}'
  );
  
  -- Create driver user with driver ID as the identifier
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    '441255',
    crypt('warcraft', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"driver"}'
  );

  -- Clean up public.users table
  DELETE FROM public.users WHERE driver_id IN ('admin', '441255');

  -- Insert into public.users table for admin
  INSERT INTO public.users (id, name, email, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  SELECT 
    id, 
    'Administrador', 
    'admin', 
    'admin', 
    'admin', 
    id, 
    id, 
    now(),
    'N/A',
    'N/A',
    'TODOS'
  FROM auth.users WHERE email = 'admin';

  -- Insert into public.users table for driver
  INSERT INTO public.users (id, name, email, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  SELECT 
    id, 
    'Entregador 441255', 
    '441255', 
    '441255', 
    'driver', 
    id, 
    id, 
    now(),
    'UTILITARIO',
    'QNU7D48',
    'CAMPO BOM / RS'
  FROM auth.users WHERE email = '441255';
END
$$;

-- Add vehicle and hub information columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hub TEXT;

-- Create regions table for driver region selection
CREATE TABLE IF NOT EXISTS public.driver_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  region_type TEXT NOT NULL, -- 'primary' or 'backup'
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for driver_regions table
alter publication supabase_realtime add table driver_regions;