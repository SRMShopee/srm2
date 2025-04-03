-- Criar tabela de hubs se não existir
CREATE TABLE IF NOT EXISTS public.hubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de cidades se não existir
CREATE TABLE IF NOT EXISTS public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cep TEXT,
  hub_id UUID REFERENCES public.hubs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir hub padrão se não existir
INSERT INTO public.hubs (id, name, city, state)
VALUES ('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SINOSPLEX', 'CAMPO BOM', 'RS')
ON CONFLICT (id) DO NOTHING;

-- Inserir cidades para o hub padrão
INSERT INTO public.cities (hub_id, name, cep) VALUES
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'ARARICA', '93880-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'BOM PRINCIPIO', '95765-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'CAMPO BOM', '93700-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'CAPELA DE SANTANA', '95745-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'DOIS IRMAOS', '93950-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'ESTANCIA VELHA', '93600-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'ESTEIO', '93260-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'HARMONIA', '95785-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'IGREJINHA', '95650-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'IVOTI', '93900-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'LINDOLFO COLLOR', '93940-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'MONTENEGRO', '95780-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'MORRO REUTER', '93990-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'NOVA HARTZ', '93890-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'NOVO HAMBURGO', '93300-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'PARECI NOVO', '95783-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'PAROBE', '95630-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'PICADA CAFE', '95175-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'PORTAO', '93180-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'PRESIDENTE LUCENA', '93945-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'RIOZINHO', '95695-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'ROLANTE', '95690-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SANTA MARIA DO HERVAL', '93995-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SAO JOSE DO HORTENCIO', '95755-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SAO LEOPOLDO', '93000-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SAO SEBASTIAO DO CAI', '95760-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SAPIRANGA', '93800-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'SAPUCAIA DO SUL', '93200-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'TAQUARA', '95600-000'),
('8ead7d90-3e05-47a3-b76f-67d5e1e74201', 'TRES COROAS', '95660-000')
ON CONFLICT DO NOTHING;

-- Habilitar realtime para a tabela de cidades
alter publication supabase_realtime add table cities;

-- Adicionar hub_id aos usuários se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'hub_id') THEN
    ALTER TABLE public.users ADD COLUMN hub_id UUID REFERENCES public.hubs(id);
  END IF;
END $$;

-- Atualizar usuários existentes para usar o hub padrão
UPDATE public.users
SET hub_id = '8ead7d90-3e05-47a3-b76f-67d5e1e74201'
WHERE hub_id IS NULL;
