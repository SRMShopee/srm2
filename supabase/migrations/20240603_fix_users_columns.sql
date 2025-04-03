-- Add vehicle and hub information columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hub TEXT;

-- Create driver_regions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.driver_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  region_type TEXT NOT NULL, -- 'primary' or 'backup'
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for driver_regions table
alter publication supabase_realtime add table driver_regions;

-- Update user data for driver 441255
UPDATE public.users
SET 
  vehicle_type = 'UTILITARIO',
  vehicle_plate = 'QNU7D48',
  hub = 'CAMPO BOM / RS'
WHERE driver_id = '441255';
