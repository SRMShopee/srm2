-- Fix user creation to properly handle IDs
DO $$
BEGIN
  -- Reset admin user password and ensure it exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin') THEN
    -- Update the password for the admin user
    UPDATE auth.users
    SET encrypted_password = crypt('password123', gen_salt('bf'))
    WHERE email = 'admin';
  ELSE
    -- Insert admin user if it doesn't exist
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
    VALUES (
      'admin',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb
    );
  END IF;
  
  -- Ensure admin user exists in public.users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE driver_id = 'admin') THEN
    -- Get the user_id from auth.users
    INSERT INTO public.users (id, driver_id, name, role, token_identifier, created_at)
    SELECT 
      id, 
      'admin', 
      'Administrador', 
      'admin', 
      id, 
      now()
    FROM auth.users 
    WHERE email = 'admin';
  ELSE
    -- Update existing admin user in public.users
    UPDATE public.users
    SET role = 'admin',
        name = 'Administrador',
        id = (SELECT id FROM auth.users WHERE email = 'admin')
    WHERE driver_id = 'admin';
  END IF;
  
  -- Create a test driver user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'driver1') THEN
    -- Insert test driver user
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role, raw_app_meta_data)
    VALUES (
      'driver1',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider": "email", "providers": ["email"], "role": "driver"}'::jsonb
    );
  END IF;
  
  -- Ensure driver1 user exists in public.users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE driver_id = 'driver1') THEN
    -- Insert into public.users
    INSERT INTO public.users (id, driver_id, name, role, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
    SELECT 
      id, 
      'driver1', 
      'Entregador Teste', 
      'driver', 
      id, 
      now(),
      'Moto',
      'ABC1234',
      'SINOSPLEX'
    FROM auth.users 
    WHERE email = 'driver1';
  ELSE
    -- Update existing driver user in public.users
    UPDATE public.users
    SET role = 'driver',
        name = 'Entregador Teste',
        id = (SELECT id FROM auth.users WHERE email = 'driver1')
    WHERE driver_id = 'driver1';
  END IF;
END $$;