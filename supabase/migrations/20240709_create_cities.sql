-- Make sure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hubs table if it doesn't exist (to ensure foreign key reference works)
CREATE TABLE IF NOT EXISTS hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  uf TEXT NOT NULL,
  hub_id UUID NOT NULL REFERENCES hubs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cities for the hub with ID 8ead7d90-3e05-47a3-b76f-67d5e1e74201
-- First ensure the hub exists
INSERT INTO hubs (id, name, code, created_at, updated_at)
VALUES ('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SINOSPLEX', 'SINOSPLEX_CODE', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert cities
INSERT INTO cities (name, uf, hub_id, created_at, updated_at)
VALUES
  ('ARARICA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('BOM PRINCIPIO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('CAMPO BOM', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('CAPELA DE SANTANA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('DOIS IRMAOS', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('ESTANCIA VELHA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('ESTEIO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('HARMONIA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('IGREJINHA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('IVOTI', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('LINDOLFO COLLOR', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('MONTENEGRO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('MORRO REUTER', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('NOVA HARTZ', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('NOVO HAMBURGO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('PARECI NOVO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('PAROBE', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('PICADA CAFE', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('PORTAO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('PRESIDENTE LUCENA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('RIOZINHO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('ROLANTE', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SANTA MARIA DO HERVAL', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SAO JOSE DO HORTENCIO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SAO LEOPOLDO', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SAO SEBASTIAO DO CAI', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SAPIRANGA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('SAPUCAIA DO SUL', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('TAQUARA', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now()),
  ('TRES COROAS', 'RS', '8ead7d90-3e05-47a3-b76f-67d5e1e74201', now(), now());

-- Enable realtime for cities table
alter publication supabase_realtime add table cities;