-- Add loading_time column to routes table
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS loading_time VARCHAR(5);

-- Add comment to the column
COMMENT ON COLUMN public.routes.loading_time IS 'The loading time for the route in HH:MM format';

-- Update existing routes to have a default loading time of 30 minutes
UPDATE public.routes SET loading_time = '00:30' WHERE loading_time IS NULL;
