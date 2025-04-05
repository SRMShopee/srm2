-- Disable RLS for user_preferences table to allow service role access
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users on their own data
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences"
ON user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS but ensure service role can bypass it
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
