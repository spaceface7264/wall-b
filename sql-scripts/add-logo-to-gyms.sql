-- Add logo_url column to gyms table
-- Run this in your Supabase SQL Editor

ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN gyms.logo_url IS 'URL of the gym logo (typically displayed in cards and small views)';

-- Success message
SELECT 'logo_url column added successfully to gyms table!' as status;

