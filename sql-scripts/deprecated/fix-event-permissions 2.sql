-- Fix event creation permissions
-- Run this in your Supabase SQL Editor

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read events" ON events;
DROP POLICY IF EXISTS "Allow community members to create events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to create events" ON events;
DROP POLICY IF EXISTS "Allow event creators to update their events" ON events;
DROP POLICY IF EXISTS "Allow event creators to delete their events" ON events;

-- 2. Create very permissive policies for testing
CREATE POLICY "Allow all authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Make sure you're a member of the professional communities
-- (This will only work if you're logged in)
INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

-- 4. Test event creation with a simple test event
INSERT INTO events (community_id, created_by, title, description, event_date, event_type, location)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    auth.uid(),
    'Test Event - Permission Check',
    'This is a test event to verify permissions are working',
    NOW() + INTERVAL '1 day',
    'meetup',
    'Test Location'
);

-- 5. Verify the test event was created
SELECT 'Test event created successfully!' as status;
SELECT id, title, community_id, created_by FROM events WHERE title = 'Test Event - Permission Check';

-- 6. Show your community memberships
SELECT 'Your community memberships:' as info;
SELECT c.name, c.id, cm.role, cm.joined_at
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.user_id = auth.uid();


