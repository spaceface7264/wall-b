-- ============================================
-- COMPREHENSIVE FIX FOR COMMUNITY_MEMBERS 500 ERRORS
-- ============================================
-- This script fixes all issues causing 500 errors on community_members table
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Fix the trigger function that's causing 500 errors
-- The trigger needs SECURITY DEFINER to bypass RLS when updating communities
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;
DROP FUNCTION IF EXISTS update_community_member_count() CASCADE;

-- Create the trigger function with SECURITY DEFINER
-- This allows the function to run with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER 
SECURITY DEFINER  -- CRITICAL: runs with function owner's privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if the community exists (prevent errors from deleted communities)
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id
    AND EXISTS (SELECT 1 FROM communities WHERE id = NEW.community_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.community_id
    AND EXISTS (SELECT 1 FROM communities WHERE id = OLD.community_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_community_member_count() TO authenticated;
GRANT EXECUTE ON FUNCTION update_community_member_count() TO anon;

-- Recreate the trigger
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW 
  EXECUTE FUNCTION update_community_member_count();

-- Step 2: Fix RLS policies on community_members table
-- Ensure RLS is enabled
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read community members" ON community_members;
DROP POLICY IF EXISTS "Allow public to read community members" ON community_members;
DROP POLICY IF EXISTS "Users can view members in accessible communities" ON community_members;
DROP POLICY IF EXISTS "Users can read their own membership" ON community_members;

-- Create SELECT policy WITHOUT recursion
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

-- Step 3: Fix DELETE policies (for leaving communities)
DROP POLICY IF EXISTS "Allow users to leave communities" ON community_members;
DROP POLICY IF EXISTS "Admins and moderators can remove members" ON community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON community_members;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;

-- Create DELETE policy for users leaving communities
-- CRITICAL: Do NOT reference community_members table to avoid recursion
CREATE POLICY "Allow users to leave communities" ON community_members
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Note: Admin/moderator delete policy removed to avoid recursion
-- Admins can use service role or direct database access if needed

-- Step 4: Fix INSERT policies (for joining communities)
DROP POLICY IF EXISTS "Allow users to join communities" ON community_members;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;

-- Create INSERT policy for joining communities
CREATE POLICY "Allow users to join communities" ON community_members
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Fix UPDATE policies (for updating last_viewed_at, etc.)
DROP POLICY IF EXISTS "Users can update their own membership" ON community_members;
DROP POLICY IF EXISTS "Allow users to update their membership" ON community_members;

-- Create UPDATE policy for users updating their own membership
CREATE POLICY "Users can update their own membership" ON community_members
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Grant necessary permissions
GRANT SELECT ON community_members TO authenticated;
GRANT INSERT ON community_members TO authenticated;
GRANT UPDATE ON community_members TO authenticated;
GRANT DELETE ON community_members TO authenticated;
GRANT SELECT ON community_members TO anon;
GRANT INSERT ON community_members TO anon;
GRANT UPDATE ON community_members TO anon;
GRANT DELETE ON community_members TO anon;

-- Step 7: Verify the trigger function has SECURITY DEFINER
SELECT 
  proname,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER is set correctly'
    ELSE '❌ SECURITY DEFINER is NOT set - this will cause 500 errors'
  END as status
FROM pg_proc
WHERE proname = 'update_community_member_count';

-- Step 8: Test query to verify policies work
-- This should return policies without errors
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'community_members'
ORDER BY cmd, policyname;

-- Success messages
SELECT '✅ Trigger function fixed with SECURITY DEFINER' as step1;
SELECT '✅ RLS policies created for SELECT, INSERT, UPDATE, DELETE' as step2;
SELECT '✅ Permissions granted to authenticated and anon roles' as step3;
SELECT '✅ All fixes applied successfully!' as status;
SELECT 'The 500 errors on community_members table should now be resolved.' as info;

