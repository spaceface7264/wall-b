-- Add facilities column to gym_requests table
-- Run this in your Supabase SQL Editor

ALTER TABLE gym_requests 
ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN gym_requests.facilities IS 'Array of facility features (e.g., Kilter Board, Moon Board, Spray Wall, Shower, Parking, etc.)';

