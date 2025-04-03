-- This migration ensures that the login redirection works correctly
-- by adding a trigger to update the last_login timestamp

-- Add last_login column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create or replace function to update last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_user_last_login ON users;

-- Create trigger to update last_login on user update
CREATE TRIGGER update_user_last_login
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_last_login();
