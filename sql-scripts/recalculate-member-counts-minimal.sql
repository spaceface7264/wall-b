-- Minimal Script to Recalculate Community Member Counts
-- This script ONLY updates member counts - does not touch functions or triggers
-- Use this if the full script encounters errors
-- Run this in your Supabase SQL Editor

-- Simply recalculate all member counts based on actual community_members data
UPDATE communities
SET member_count = (
  SELECT COUNT(*)
  FROM community_members
  WHERE community_members.community_id = communities.id
);

-- Verify the results
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





