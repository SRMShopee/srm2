-- Create a test user for login
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password)
VALUES 
('00000000-0000-0000-0000-000000000000', 'test123', now(), now(), now(), '{"provider":"email","providers":["email"],"role":"driver"}', '{}', false, '$2a$10$Nt/oPwsIjnJnZnGWVSvwVeQHCBnIIopCyOJnb.pJQjvwLVdv.W7iq')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding user in public.users table
INSERT INTO public.users (id, name, driver_id, token_identifier, role, created_at)
VALUES 
('00000000-0000-0000-0000-000000000000', 'Usuário Teste', 'test123', '00000000-0000-0000-0000-000000000000', 'driver', now())
ON CONFLICT (id) DO NOTHING;