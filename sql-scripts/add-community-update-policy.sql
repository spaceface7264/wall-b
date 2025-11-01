-- Add Update Policy for Communities (Admins)
-- Run this in your Supabase SQL Editor

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Allow admins to update communities" ON communities;
DROP POLICY IF EXISTS "Users can update their own communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated users to update communities" ON communities;

-- Create policy that allows:
-- 1. Admins to update any community
-- 2. Users to update communities they created (as admins/moderators)
CREATE POLICY "Allow admins to update communities" ON communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
    OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Test the policy
SELECT 'Community update policy added successfully!' as status;
SELECT 'Admins and community admins/moderators can now update communities' as info;

