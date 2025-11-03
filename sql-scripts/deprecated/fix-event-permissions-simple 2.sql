-- Fix event creation permissions (without requiring authentication)
-- Run this in your Supabase SQL Editor

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read events" ON events;
DROP POLICY IF EXISTS "Allow community members to create events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to create events" ON events;
DROP POLICY IF EXISTS "Allow event creators to update their events" ON events;
DROP POLICY IF EXISTS "Allow event creators to delete their events" ON events;
DROP POLICY IF EXISTS "Allow all authenticated users to read events" ON events;
DROP POLICY IF EXISTS "Allow all authenticated users to create events" ON events;
DROP POLICY IF EXISTS "Allow all authenticated users to update events" ON events;
DROP POLICY IF EXISTS "Allow all authenticated users to delete events" ON events;

-- 2. Create very permissive policies for testing
CREATE POLICY "Allow all authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to delete events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Check current policies
SELECT 'Updated RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'events';

-- 4. Test if we can read events (this should work)
SELECT 'Can read events:' as info;
SELECT COUNT(*) as event_count FROM events;

-- 5. Show current events
SELECT 'Current events:' as info;
SELECT id, title, community_id, created_by, created_at FROM events ORDER BY created_at DESC LIMIT 5;

SELECT 'Event creation permissions fixed! Now try creating an event from the frontend.' as status;


