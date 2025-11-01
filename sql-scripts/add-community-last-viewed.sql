-- Add last_viewed_at column to community_members table
-- This tracks when a user last visited a community to determine if there are new posts

-- Add the column if it doesn't exist
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS community_members_last_viewed_at_idx 
ON community_members(last_viewed_at);

-- Add RLS policy to allow users to update their own last_viewed_at
-- Users can update their own last_viewed_at timestamp
CREATE POLICY "Users can update their own last_viewed_at" ON community_members
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

