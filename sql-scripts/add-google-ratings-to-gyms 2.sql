-- Add Google Ratings Columns to Gyms Table
-- Run this in your Supabase SQL Editor

-- Add Google rating columns to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS google_ratings_count INTEGER;

-- Add Google rating columns to gym_requests table (to store ratings from scraping)
ALTER TABLE gym_requests 
ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS google_ratings_count INTEGER;

-- Add comments to document the columns
COMMENT ON COLUMN gyms.google_rating IS 'Google Places rating (0-5 scale)';
COMMENT ON COLUMN gyms.google_ratings_count IS 'Number of Google Places ratings';
COMMENT ON COLUMN gym_requests.google_rating IS 'Google Places rating from source data (0-5 scale)';
COMMENT ON COLUMN gym_requests.google_ratings_count IS 'Number of Google Places ratings from source data';

-- Success message
SELECT 'Google ratings columns added successfully!' as status;


