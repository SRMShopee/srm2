-- Ensure the role column exists in the users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'driver';
  END IF;
END $$;

-- Update existing users without a role to have the default 'driver' role
UPDATE public.users SET role = 'driver' WHERE role IS NULL;

-- Create admin user if it doesn't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'admin@example.com', 
  crypt('password123', gen_salt('bf')), 
  now(), 
  now(), 
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com');

-- Get the ID of the admin user
DO $$ 
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';
  
  -- Insert or update the admin user in the public.users table with token_identifier
  INSERT INTO public.users (id, email, role, driver_id, token_identifier)
  VALUES (admin_id, 'admin@example.com', 'admin', 'ADMIN001', admin_id)
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', driver_id = 'ADMIN001', token_identifier = EXCLUDED.token_identifier;
END $$;
