-- Fix for the driver regions table and related schema issues

-- Create driver_regions table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_regions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, city_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS driver_regions_user_id_idx ON driver_regions(user_id);

-- Create index on city_id for faster lookups
CREATE INDEX IF NOT EXISTS driver_regions_city_id_idx ON driver_regions(city_id);

-- Add RLS policies for driver_regions
ALTER TABLE driver_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own regions" ON driver_regions;
CREATE POLICY "Users can view their own regions"
  ON driver_regions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own regions" ON driver_regions;
CREATE POLICY "Users can insert their own regions"
  ON driver_regions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own regions" ON driver_regions;
CREATE POLICY "Users can update their own regions"
  ON driver_regions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own regions" ON driver_regions;
CREATE POLICY "Users can delete their own regions"
  ON driver_regions FOR DELETE
  USING (auth.uid() = user_id);

-- Add realtime for driver_regions (check if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'driver_regions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE driver_regions;
  END IF;
END
$$;

-- Check if users table is already in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END
$$;
