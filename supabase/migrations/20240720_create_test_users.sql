-- Criar usuários de teste para facilitar o login

-- Verificar se o usuário admin já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE driver_id = 'admin') THEN
        INSERT INTO users (id, name, driver_id, hub_id, permissions, phone, created_at, updated_at)
        VALUES (
            'admin-user-id',
            'Administrador',
            'admin',
            'SINOSPLEX',
            'admin',
            '51999999999',
            NOW(),
            NOW()
        );
    END IF;

    -- Verificar se o usuário entregador já existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE driver_id = '12345') THEN
        INSERT INTO users (id, name, driver_id, hub_id, permissions, phone, created_at, updated_at)
        VALUES (
            'driver-user-id',
            'Entregador Demo',
            '12345',
            'SINOSPLEX',
            'USER',
            '51999994567',
            NOW(),
            NOW()
        );
    END IF;
END
$$;