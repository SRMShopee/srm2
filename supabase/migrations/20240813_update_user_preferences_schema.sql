-- Add hub_id column to user_preferences if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_preferences' AND column_name = 'hub_id') THEN
        ALTER TABLE user_preferences ADD COLUMN hub_id UUID REFERENCES hubs(id);
    END IF;
END$$;

-- Update existing records to use hub_id from users table
UPDATE user_preferences
SET hub_id = users.hub_id
FROM users
WHERE user_preferences.user_id = users.id AND user_preferences.hub_id IS NULL;
