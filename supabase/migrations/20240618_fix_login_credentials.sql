-- Reset admin user password and ensure it exists
DO $$
BEGIN
  -- First check if admin user exists in auth.users
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
        name = 'Administrador'
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
  END IF;
END $$;
