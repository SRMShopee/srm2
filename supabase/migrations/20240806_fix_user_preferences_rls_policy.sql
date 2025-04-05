-- Enable Row Level Security on the user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;

-- Create a policy that allows users to insert, update, and select their own preferences
CREATE POLICY "Users can manage their own preferences"
ON user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the auth.uid() function is being used correctly by granting permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
