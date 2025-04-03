-- Create an admin user for testing
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@shopee.com', now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Set the password for the admin user
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, encrypted_password, created_at, updated_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@shopee.com', now(), '{"provider":"email","providers":["email"],"role":"admin"}', '{}', '$2a$10$Ql8Yk9QQy6VtpQQPLmy0X.KbUYZ.Rkj8D1F0Y0cz/WJCMiYGG9JXu', now(), now())
ON CONFLICT (id) DO UPDATE
SET encrypted_password = EXCLUDED.encrypted_password;

-- Create the admin user in the public.users table
INSERT INTO public.users (id, name, driver_id, role, token_identifier, created_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Administrador', 'admin@shopee.com', 'admin', '11111111-1111-1111-1111-111111111111', now())
ON CONFLICT (id) DO UPDATE
SET role = 'admin', driver_id = 'admin@shopee.com';
