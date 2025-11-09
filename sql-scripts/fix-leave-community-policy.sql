-- ============================================
-- Fix Leave Community RLS Policy
-- ============================================
-- This script ensures users can delete their own community memberships
-- Run this in your Supabase SQL Editor
-- ============================================

-- Ensure RLS is enabled on community_members table
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing DELETE policies to avoid conflicts
DROP POLICY IF EXISTS "Allow users to leave communities" ON community_members;
DROP POLICY IF EXISTS "Admins and moderators can remove members" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON community_members;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;

-- Grant necessary permissions (ensure authenticated role has DELETE permission)
GRANT DELETE ON community_members TO authenticated;
GRANT DELETE ON community_members TO anon; -- Sometimes needed for service role operations

-- Create policy that allows users to delete their own membership records
-- This is the primary policy for users leaving communities
CREATE POLICY "Allow users to leave communities" ON community_members
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Also ensure admins and moderators can remove members (optional but useful)
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

-- Test query to verify the policy exists (fixed the OR condition with parentheses)
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
AND (policyname LIKE '%leave%' OR policyname LIKE '%remove%' OR cmd = 'DELETE');

-- Success message
SELECT 'Leave community RLS policy created successfully!' as status;
SELECT 'Users can now leave communities by deleting their own membership records' as info;

