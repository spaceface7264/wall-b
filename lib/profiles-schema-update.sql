-- Add new fields to profiles table for enhanced user profiles
-- This migration adds nickname, country, and city fields

-- Add nickname field (optional, can be used as display name)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add location fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing profiles to use full_name as nickname if nickname is empty
UPDATE profiles 
SET nickname = full_name 
WHERE nickname IS NULL OR nickname = '';

-- Add indexes for better performance on location searches
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- Add comments for documentation
COMMENT ON COLUMN profiles.nickname IS 'Display name for the user, defaults to full_name if empty';
COMMENT ON COLUMN profiles.country IS 'User country location';
COMMENT ON COLUMN profiles.city IS 'User city location';
