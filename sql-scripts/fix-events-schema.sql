-- Fix events table schema
-- Run this in your Supabase SQL Editor

-- First, check if the events table exists and what columns it has
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- If the table doesn't exist or is missing columns, recreate it:
DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT DEFAULT 'meetup' CHECK (event_type IN ('meetup', 'competition', 'training', 'social')),
  location TEXT,
  max_participants INTEGER,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS events_community_id_idx ON events(community_id);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON events(created_by);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow community members to create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_id = events.community_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow event creators to update their events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Allow event creators to delete their events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON events TO authenticated;
