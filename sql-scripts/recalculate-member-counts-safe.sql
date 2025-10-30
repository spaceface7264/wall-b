-- Recalculate Community Member Counts (Safe Version)
-- This script ensures member_count in communities table reflects actual members in community_members table
-- Handles existing functions and schema issues gracefully
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure the trigger function exists (safe version)
-- Drop the function if it exists with the old signature that might reference parent_id
DROP FUNCTION IF EXISTS update_community_member_count() CASCADE;

CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Ensure the trigger exists (drop first if it exists, then recreate)
DROP TRIGGER IF EXISTS update_community_member_count_trigger ON community_members;

CREATE TRIGGER update_community_member_count_trigger
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Step 3: Recalculate all member counts based on actual community_members data
-- Temporarily disable the trigger to avoid double-counting during recalculation
DO $$
BEGIN
  -- Try to disable trigger, ignore error if it doesn't exist or can't be disabled
  BEGIN
    ALTER TABLE community_members DISABLE TRIGGER update_community_member_count_trigger;
  EXCEPTION WHEN OTHERS THEN
    -- Trigger might not exist yet, that's okay
    NULL;
  END;

  -- Update member counts
  UPDATE communities
  SET member_count = (
    SELECT COUNT(*)
    FROM community_members
    WHERE community_members.community_id = communities.id
  );

  -- Re-enable the trigger
  BEGIN
    ALTER TABLE community_members ENABLE TRIGGER update_community_member_count_trigger;
  EXCEPTION WHEN OTHERS THEN
    -- If we can't enable, that's okay - trigger will be created above
    NULL;
  END;
END $$;

-- Step 4: Verify the results (optional - shows communities with their correct member counts)
SELECT 
  c.id,
  c.name,
  c.member_count as stored_count,
  COUNT(cm.id) as actual_count,
  CASE 
    WHEN c.member_count = COUNT(cm.id) THEN '✓ Correct'
    ELSE '✗ Mismatch'
  END as status
FROM communities c
LEFT JOIN community_members cm ON cm.community_id = c.id
GROUP BY c.id, c.name, c.member_count
ORDER BY c.name;

