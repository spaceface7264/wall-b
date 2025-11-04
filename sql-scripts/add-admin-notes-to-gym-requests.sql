-- Add Admin Notes Column to Gym Requests Table
-- Run this in your Supabase SQL Editor

ALTER TABLE gym_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN gym_requests.admin_notes IS 'Admin notes and comments about the gym request';

-- Success message
SELECT 'Admin notes column added successfully!' as status;

