-- Add ban status to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Create index for banned users
CREATE INDEX IF NOT EXISTS profiles_is_banned_idx ON profiles(is_banned);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_banned IS 'Whether the user has been banned by an administrator';

