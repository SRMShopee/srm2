-- Add security improvements to the database

-- Add last_failed_login and failed_login_attempts columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'last_failed_login') THEN
    ALTER TABLE users ADD COLUMN last_failed_login TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'failed_login_attempts') THEN
    ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'account_locked_until') THEN
    ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create or replace function to reset failed login attempts after successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.failed_login_attempts = 0;
  NEW.account_locked_until = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS reset_user_failed_login_attempts ON users;

-- Create trigger to reset failed login attempts on user update
CREATE TRIGGER reset_user_failed_login_attempts
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.failed_login_attempts > 0)
EXECUTE FUNCTION reset_failed_login_attempts();
