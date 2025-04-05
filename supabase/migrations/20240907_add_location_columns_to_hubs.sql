-- Add missing location columns to hubs table
ALTER TABLE IF EXISTS public.hubs
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_in_radius INTEGER DEFAULT 100;

-- Update existing hubs with default values if needed
UPDATE public.hubs
SET 
  latitude = -23.5505, -- Default latitude (São Paulo)
  longitude = -46.6333, -- Default longitude (São Paulo)
  check_in_radius = 100 -- Default radius in meters
WHERE latitude IS NULL OR longitude IS NULL;
