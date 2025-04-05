-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hub_location_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS hub_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hub_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE hub_location_history ENABLE ROW LEVEL SECURITY;

-- Create policies for hub_location_history
DROP POLICY IF EXISTS "Admins can read hub_location_history" ON hub_location_history;
CREATE POLICY "Admins can read hub_location_history"
  ON hub_location_history
  FOR SELECT
  USING (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Admins can insert hub_location_history" ON hub_location_history;
CREATE POLICY "Admins can insert hub_location_history"
  ON hub_location_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
