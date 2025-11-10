-- Fix Community Members Trigger (500 Error Fix)
-- This script fixes the trigger function that's causing 500 errors on community_members queries
-- The issue is that the trigger runs with user permissions and RLS blocks the update
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;
DROP FUNCTION IF EXISTS update_community_member_count() CASCADE;

-- Step 2: Create the trigger function with SECURITY DEFINER
-- This allows the function to run with elevated privileges, bypassing RLS
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER 
SECURITY DEFINER  -- This is the key fix - runs with function owner's privileges
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

-- Step 3: Recreate the trigger
CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW 
  EXECUTE FUNCTION update_community_member_count();

-- Step 4: Recalculate all member counts to ensure they're correct
UPDATE communities
SET member_count = (
  SELECT COUNT(*)
  FROM community_members
  WHERE community_members.community_id = communities.id
);

-- Success message
SELECT 'Trigger function fixed successfully! The 500 errors should be resolved.' as status;

