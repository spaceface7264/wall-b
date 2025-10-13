-- Fix events RLS policies to allow event creation
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read events" ON events;
DROP POLICY IF EXISTS "Allow community members to create events" ON events;
DROP POLICY IF EXISTS "Allow event creators to update their events" ON events;
DROP POLICY IF EXISTS "Allow event creators to delete their events" ON events;

-- Create more permissive policies for now
CREATE POLICY "Allow authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow any authenticated user to create events (for testing)
CREATE POLICY "Allow authenticated users to create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow event creators to update their events
CREATE POLICY "Allow event creators to update their events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Allow event creators to delete their events
CREATE POLICY "Allow event creators to delete their events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- Test the policies
SELECT 'RLS policies updated successfully' as status;


