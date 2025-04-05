-- Check if cities table exists, if not create it
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cep VARCHAR(10),
  hub_id UUID REFERENCES hubs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing cities for this hub to avoid duplicates
DELETE FROM cities WHERE hub_id = '8ead7d90-3e05-47a3-b76f-67d5e1e74201';

-- Insert cities with CEP codes for the specified hub
INSERT INTO cities (name, cep, hub_id) VALUES
('São Paulo', '01000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Guarulhos', '07000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Campinas', '13000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Santos', '11000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('São Bernardo do Campo', '09600-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Santo André', '09000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Osasco', '06000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('São José dos Campos', '12200-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Ribeirão Preto', '14000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201'),
('Sorocaba', '18000-000', '8ead7d90-3e05-47a3-b76f-67d5e1e74201');

-- Ensure the table has the correct indexes
CREATE INDEX IF NOT EXISTS idx_cities_hub_id ON cities(hub_id);

-- We're removing the publication addition since it's already a member
-- and that's what's causing the error
-- alter publication supabase_realtime add table cities;
