-- Add privacy field to communities table
-- Run this in your Supabase SQL Editor

-- Add is_private column to communities table
ALTER TABLE communities 
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add index for better performance on privacy queries
CREATE INDEX IF NOT EXISTS communities_is_private_idx ON communities(is_private);

-- Update RLS policies if needed (private communities should only be visible to members)
-- Note: This assumes existing policies allow members to see their communities
-- You may need to update RLS policies separately based on your security requirements

-- Test the changes
SELECT 'Privacy field added successfully!' as status;
SELECT 'is_private column added with default FALSE (public)' as info;


