-- Add is_hidden column to gyms table
-- Run this in your Supabase SQL Editor

ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN gyms.is_hidden IS 'If true, gym is hidden from public listing but remains in database';

-- Create index for filtering hidden gyms
CREATE INDEX IF NOT EXISTS gyms_is_hidden_idx ON gyms(is_hidden) WHERE is_hidden = TRUE;

-- Success message
SELECT 'is_hidden column added successfully to gyms table!' as status;

