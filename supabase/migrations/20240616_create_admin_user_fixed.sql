-- Create admin user in auth.users if it doesn't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
SELECT 
  gen_random_uuid(), 
  'admin', 
  crypt('password123', gen_salt('bf')), 
  now(), 
  now(), 
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
  '{"name":"Administrador"}'::jsonb,
  false,
  'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin');

-- Get the user ID from auth.users
DO $$
DECLARE
  auth_uid uuid;
BEGIN
  SELECT id INTO auth_uid FROM auth.users WHERE email = 'admin';
  
  -- Insert into public.users if not exists
  INSERT INTO public.users (id, name, driver_id, role, token_identifier, created_at)
  SELECT 
    auth_uid,
    'Administrador',
    'admin',
    'admin',
    auth_uid::text,
    now()
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE driver_id = 'admin');
  
  -- Update if exists but role is not admin
  UPDATE public.users
  SET role = 'admin', name = 'Administrador'
  WHERE driver_id = 'admin' AND role != 'admin';
END
$$;
