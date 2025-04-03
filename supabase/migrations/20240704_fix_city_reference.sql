-- Ensure cities table exists before driver_regions references it

-- Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Add realtime for cities table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'cities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cities;
  END IF;
END
$$;

-- Ensure driver_regions table has the correct city_id reference
DO $$
BEGIN
  -- Check if driver_regions table exists and has city_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'driver_regions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'driver_regions' AND column_name = 'city_id'
  ) THEN
    -- Add city_id column if it doesn't exist
    ALTER TABLE driver_regions ADD COLUMN city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE;
    -- Add index on city_id
    CREATE INDEX IF NOT EXISTS driver_regions_city_id_idx ON driver_regions(city_id);
  END IF;
END
$$;
