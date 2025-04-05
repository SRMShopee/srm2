-- Create route_interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS route_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS route_interests_user_id_idx ON route_interests(user_id);
CREATE INDEX IF NOT EXISTS route_interests_route_id_idx ON route_interests(route_id);

-- Enable realtime for route_interests
alter publication supabase_realtime add table route_interests;

-- Add RLS policies for route_interests
ALTER TABLE route_interests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own route interests
DROP POLICY IF EXISTS "Users can view their own route interests" ON route_interests;
CREATE POLICY "Users can view their own route interests"
  ON route_interests FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own route interests
DROP POLICY IF EXISTS "Users can insert their own route interests" ON route_interests;
CREATE POLICY "Users can insert their own route interests"
  ON route_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own route interests
DROP POLICY IF EXISTS "Users can delete their own route interests" ON route_interests;
CREATE POLICY "Users can delete their own route interests"
  ON route_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to view all route interests
DROP POLICY IF EXISTS "Admins can view all route interests" ON route_interests;
CREATE POLICY "Admins can view all route interests"
  ON route_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.permissions = 'admin'
    )
  );
