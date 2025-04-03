-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with correct column mappings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, token_identifier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_app_meta_data->>'role', 'driver'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create test users for development
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '{"full_name":"Admin User"}'::jsonb, '{"role":"admin"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 'driver1@example.com', '{"full_name":"Driver One"}'::jsonb, '{"role":"driver"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
