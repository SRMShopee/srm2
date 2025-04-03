-- Criar tabela de preferências de usuário
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  primary_regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  backup_regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo CEP à tabela de cidades se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'cities' 
                 AND column_name = 'cep') THEN
    ALTER TABLE public.cities ADD COLUMN cep TEXT;
  END IF;
END $$;

-- Habilitar RLS para a tabela de preferências
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que usuários vejam apenas suas próprias preferências
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

-- Criar política para permitir que usuários atualizem apenas suas próprias preferências
CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar política para permitir que usuários insiram suas próprias preferências
CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Habilitar realtime para a tabela de preferências
alter publication supabase_realtime add table user_preferences;
