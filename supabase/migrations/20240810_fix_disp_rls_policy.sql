-- Add a policy to allow service role to access the disp table
DROP POLICY IF EXISTS "Service role can access all records" ON disp;
CREATE POLICY "Service role can access all records"
  ON disp
  USING (true)
  WITH CHECK (true);

-- Fix the updated_at column issue
ALTER TABLE disp DROP COLUMN IF EXISTS updated_at;
