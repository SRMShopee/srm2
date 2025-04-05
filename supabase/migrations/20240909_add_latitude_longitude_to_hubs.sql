-- Add latitude, longitude, and check_in_radius columns to hubs table

-- Check if columns already exist before adding them
DO $$
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hubs' AND column_name = 'latitude') THEN
        ALTER TABLE hubs ADD COLUMN latitude DOUBLE PRECISION;
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hubs' AND column_name = 'longitude') THEN
        ALTER TABLE hubs ADD COLUMN longitude DOUBLE PRECISION;
    END IF;

    -- Add check_in_radius column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hubs' AND column_name = 'check_in_radius') THEN
        ALTER TABLE hubs ADD COLUMN check_in_radius INTEGER DEFAULT 100;
    END IF;

    -- Update RLS policies to include new columns
    DROP POLICY IF EXISTS hubs_select_policy ON hubs;
    CREATE POLICY hubs_select_policy ON hubs
        FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS hubs_update_policy ON hubs;
    CREATE POLICY hubs_update_policy ON hubs
        FOR UPDATE
        USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
        WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
END
$$;
