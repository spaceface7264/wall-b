-- Clean up old placeholder communities
-- Run this AFTER fixing RLS policies

-- 1. Delete old placeholder communities
DELETE FROM communities 
WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- 2. Verify only professional communities remain
SELECT 'Remaining communities after cleanup:' as status;
SELECT id, name, member_count, created_at FROM communities ORDER BY created_at;

-- 3. Check if any data was orphaned
SELECT 'Checking for orphaned data...' as info;

-- Check for orphaned posts
SELECT 'Orphaned posts:' as info, COUNT(*) as count
FROM posts p
LEFT JOIN communities c ON p.community_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned events
SELECT 'Orphaned events:' as info, COUNT(*) as count
FROM events e
LEFT JOIN communities c ON e.community_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned community members
SELECT 'Orphaned community members:' as info, COUNT(*) as count
FROM community_members cm
LEFT JOIN communities c ON cm.community_id = c.id
WHERE c.id IS NULL;

SELECT 'Cleanup completed!' as status;