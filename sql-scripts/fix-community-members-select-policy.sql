-- Fix Community Members SELECT Policy
-- This ensures users can read their own membership records to check if they're members
-- Run this in your Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies that might be too restrictive
DROP POLICY IF EXISTS "Allow authenticated users to read community members" ON community_members;
DROP POLICY IF EXISTS "Allow public to read community members" ON community_members;
DROP POLICY IF EXISTS "Users can view members in accessible communities" ON community_members;
DROP POLICY IF EXISTS "Users can read their own membership" ON community_members;

-- Create SELECT policies WITHOUT recursion
-- CRITICAL: Do NOT reference community_members table within the policy to avoid infinite recursion
-- Policy 1: Users can always read their own membership records
CREATE POLICY "Users can read their own membership" ON community_members
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can read memberships in public communities
-- This checks communities table (not community_members) to avoid recursion
CREATE POLICY "Read memberships in public communities" ON community_members
  FOR SELECT 
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND is_private = FALSE
    )
  );

-- Grant SELECT permission (should already exist, but ensure it's there)
GRANT SELECT ON community_members TO authenticated;
GRANT SELECT ON community_members TO anon;

-- Test query to verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'community_members'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Success message
SELECT 'Community members SELECT policies created successfully!' as status;
SELECT 'Users can now read their own membership records to check membership status' as info;


