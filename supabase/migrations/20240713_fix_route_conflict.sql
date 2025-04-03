-- This migration ensures the hubs table has the correct schema
-- and adds any missing columns that might be causing issues

-- Add the code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hubs' AND column_name = 'code') THEN
    ALTER TABLE hubs ADD COLUMN code TEXT NOT NULL DEFAULT 'HUB';
  END IF;

  -- Ensure the id column is the primary key
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'hubs' AND constraint_type = 'PRIMARY KEY') THEN
    ALTER TABLE hubs ADD PRIMARY KEY (id);
  END IF;
END $$;
