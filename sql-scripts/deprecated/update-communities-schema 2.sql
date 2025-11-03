-- Update Communities Table Schema
-- Run this in your Supabase SQL Editor

-- Make gym_id optional to support both gym-connected and general communities
ALTER TABLE communities 
  ALTER COLUMN gym_id DROP NOT NULL;

-- Drop the unique constraint on gym_id since we now allow multiple general communities
DROP CONSTRAINT IF EXISTS communities_gym_id_key;

-- Add community_type column to distinguish between gym and general communities
ALTER TABLE communities 
  ADD COLUMN community_type TEXT DEFAULT 'gym' CHECK (community_type IN ('gym', 'general'));

-- Update existing communities to be gym type (they all have gym_id)
UPDATE communities 
  SET community_type = 'gym' 
  WHERE gym_id IS NOT NULL;

-- Create index for better performance on community_type queries
CREATE INDEX IF NOT EXISTS communities_type_idx ON communities(community_type);

-- Add RLS policies for the new community types
CREATE POLICY "Allow authenticated users to read all communities" ON communities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create general communities" ON communities
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    community_type = 'general'
  );

CREATE POLICY "Allow authenticated users to create gym communities" ON communities
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    community_type = 'gym' AND
    gym_id IS NOT NULL
  );

-- Test the changes
SELECT 'Communities schema updated successfully!' as status;
SELECT 'gym_id is now optional and community_type column added' as info;
