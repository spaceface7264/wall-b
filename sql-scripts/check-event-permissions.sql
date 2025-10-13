-- Check event creation permissions and RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS policies on events table
SELECT 'Current RLS policies on events table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'events';

-- 2. Check if you're a member of any communities
SELECT 'Your community memberships:' as info;
SELECT c.name, c.id, cm.role, cm.joined_at
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.user_id = auth.uid();

-- 3. Check if events table has the right structure
SELECT 'Events table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 4. Test if you can read events
SELECT 'Can read events:' as info;
SELECT COUNT(*) as event_count FROM events;

-- 5. Check if there are any events in the professional communities
SELECT 'Events in professional communities:' as info;
SELECT c.name, COUNT(e.id) as event_count
FROM communities c
LEFT JOIN events e ON c.id = e.community_id
WHERE c.id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
)
GROUP BY c.id, c.name;


