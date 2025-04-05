-- Enable RLS on user_preferences table if not already enabled
ALTER TABLE IF EXISTS public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;

-- Create policy to allow users to manage their own preferences
CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
