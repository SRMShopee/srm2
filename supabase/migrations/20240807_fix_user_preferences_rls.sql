-- Enable RLS on the user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- Create policy for INSERT operations
CREATE POLICY "Users can insert their own preferences"
ON user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for SELECT operations
CREATE POLICY "Users can view their own preferences"
ON user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for UPDATE operations
CREATE POLICY "Users can update their own preferences"
ON user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for DELETE operations
CREATE POLICY "Users can delete their own preferences"
ON user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE user_preferences TO authenticated;
