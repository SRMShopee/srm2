-- First, delete any existing users to avoid conflicts
DELETE FROM public.users WHERE driver_id IN ('admin', '441255');
DELETE FROM auth.users WHERE email IN ('admin', '441255');

-- Create admin user with driver ID as the identifier
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  driver_id UUID := gen_random_uuid();
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
END
$$;