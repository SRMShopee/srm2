-- First, disable RLS on the user_preferences table
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create new policies that properly handle both read and write operations
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Re-enable RLS on the user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
