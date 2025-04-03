-- Delete existing users to recreate them properly
DO $$
BEGIN
  -- Delete existing auth users
  DELETE FROM auth.users WHERE email IN ('admin@shopee.delivery', 'driver441255@shopee.delivery', 'admin', '441255');
  
  -- Delete existing public users
  DELETE FROM public.users WHERE driver_id IN ('admin', '441255');
  
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

  -- Insert into public.users table for admin
  INSERT INTO public.users (id, name, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  SELECT 
    id, 
    'Administrador', 
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
  INSERT INTO public.users (id, name, driver_id, role, user_id, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
  SELECT 
    id, 
    'Entregador 441255', 
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