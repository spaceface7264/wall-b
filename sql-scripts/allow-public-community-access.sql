-- Allow public access to communities for invite link previews
-- Run this in your Supabase SQL Editor

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to read communities" ON communities;
DROP POLICY IF EXISTS "Allow admins to read all communities" ON communities;
DROP POLICY IF EXISTS "Allow public to read active communities" ON communities;

-- Create policy that allows:
-- 1. Authenticated users to read all communities
-- 2. Anonymous users to read active (non-suspended) communities (for invite link previews)
CREATE POLICY "Allow public to read active communities" ON communities
  FOR SELECT 
  USING (
    -- Authenticated users can read all communities
    auth.role() = 'authenticated'
    OR
    -- Anonymous users can only read active communities (for invite previews)
    (auth.role() = 'anon' AND is_active = TRUE)
  );

-- Also ensure admins can read all communities (including suspended ones)
CREATE POLICY "Allow admins to read all communities" ON communities
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

-- Note: The policies will be evaluated with OR, so authenticated users and admins
-- will have access, and anonymous users will have access to active communities only.

