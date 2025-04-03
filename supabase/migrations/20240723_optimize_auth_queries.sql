-- Add indexes to improve query performance for authentication and user preferences

-- Add index on driver_id for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_driver_id ON users (driver_id);

-- Add index on user_id for faster preference lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);

-- Add index on failed_login_attempts to quickly identify locked accounts
CREATE INDEX IF NOT EXISTS idx_users_failed_login_attempts ON users (failed_login_attempts);

-- Add index on account_locked_until to quickly filter locked accounts
CREATE INDEX IF NOT EXISTS idx_users_account_locked_until ON users (account_locked_until);

-- Add index on last_failed_login for security monitoring
CREATE INDEX IF NOT EXISTS idx_users_last_failed_login ON users (last_failed_login);

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable realtime for user_preferences table
ALTER PUBLICATION supabase_realtime ADD TABLE user_preferences;
