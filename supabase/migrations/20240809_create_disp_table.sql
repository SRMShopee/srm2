-- Create the disp table for storing user availability
CREATE TABLE IF NOT EXISTS disp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  vehicle TEXT,
  disp BOOLEAN DEFAULT false,
  turno TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE disp ENABLE ROW LEVEL SECURITY;

-- Create policies for the disp table
DROP POLICY IF EXISTS "Users can view their own availability" ON disp;
CREATE POLICY "Users can view their own availability"
  ON disp FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own availability" ON disp;
CREATE POLICY "Users can update their own availability"
  ON disp FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own availability" ON disp;
CREATE POLICY "Users can insert their own availability"
  ON disp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own availability" ON disp;
CREATE POLICY "Users can delete their own availability"
  ON disp FOR DELETE
  USING (auth.uid() = user_id);

-- Add to realtime publication if not already a member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'disp'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE disp;
  END IF;
END
$$;