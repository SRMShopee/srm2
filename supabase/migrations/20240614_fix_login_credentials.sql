-- Update admin user to use 'admin' as driver_id
UPDATE auth.users
SET email = 'admin'
WHERE email = 'admin@shopee.com';

-- Update the admin user in public.users
UPDATE public.users
SET driver_id = 'admin'
WHERE driver_id = 'admin@shopee.com';

-- Create a test driver with ID 441255 if it doesn't exist
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, encrypted_password, created_at, updated_at)
VALUES 
('22222222-2222-2222-2222-222222222222', '441255', now(), '{"provider":"email","providers":["email"],"role":"driver"}', '{}', '$2a$10$Ql8Yk9QQy6VtpQQPLmy0X.KbUYZ.Rkj8D1F0Y0cz/WJCMiYGG9JXu', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create the driver user in public.users if it doesn't exist
INSERT INTO public.users (id, name, driver_id, role, token_identifier, created_at, vehicle_type, vehicle_plate, hub)
VALUES 
('22222222-2222-2222-2222-222222222222', 'Entregador Teste', '441255', 'driver', '22222222-2222-2222-2222-222222222222', now(), 'Moto', 'ABC1234', 'SINOSPLEX')
ON CONFLICT (id) DO NOTHING;
