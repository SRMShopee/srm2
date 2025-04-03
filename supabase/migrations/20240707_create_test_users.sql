-- Create test users

-- Create admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@driver.shopee.local', '$2a$10$Ql9XZz3Jz1UNQRNr0ITXb.XKD.Qw8gk/2kRf1L9jNLOk6TBDk.Pnq', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create regular user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '441255@driver.shopee.local', '$2a$10$Ql9XZz3Jz1UNQRNr0ITXb.XKD.Qw8gk/2kRf1L9jNLOk6TBDk.Pnq', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create corresponding entries in public.users table
INSERT INTO public.users (id, name, driver_id, email, phone, permissions, state, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Administrador', 'admin', 'admin@driver.shopee.local', '0000000000', 'admin', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Usuário Teste', '441255', '441255@driver.shopee.local', '55 51 995459044', 'USER', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for users table
alter publication supabase_realtime add table users;

-- Drop the trigger first if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    driver_id,
    phone,
    permissions,
    state,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'driver_id', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'USER',
    'active',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
