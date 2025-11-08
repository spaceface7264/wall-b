-- ============================================
-- Fix Leave Community RLS Policy
-- ============================================
-- This script ensures users can delete their own community memberships
-- Run this in your Supabase SQL Editor
-- ============================================

-- Ensure RLS is enabled on community_members table
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Allow users to leave communities" ON community_members;

-- Create policy that allows users to delete their own membership records
CREATE POLICY "Allow users to leave communities" ON community_members
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Also ensure admins and moderators can remove members (optional but useful)
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins and moderators can remove members" ON community_members;

-- Create policy for admins/moderators to remove members from their communities
CREATE POLICY "Admins and moderators can remove members" ON community_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'moderator')
    )
  );

-- Grant necessary permissions
GRANT DELETE ON community_members TO authenticated;

-- Test query to verify the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_members'
AND policyname LIKE '%leave%' OR policyname LIKE '%remove%';

-- Success message
SELECT 'Leave community RLS policy created successfully!' as status;

