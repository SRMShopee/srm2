-- Adicionar colunas faltantes na tabela hubs
ALTER TABLE public.hubs
ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT 'HUB-' || SUBSTRING(id::text, 1, 8),
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS residence_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS street TEXT DEFAULT '';

-- Atualizar o hub existente
UPDATE public.hubs
SET 
  code = 'HUB-' || SUBSTRING(id::text, 1, 8),
  complement = NULL,
  neighborhood = 'Centro',
  residence_number = 100,
  street = 'Av. Principal'
WHERE id = '8ead7d90-3e05-47a3-b76f-67d5e1e74201';
