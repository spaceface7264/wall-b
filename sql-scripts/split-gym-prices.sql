-- Split gyms price_range into single_entry_price and membership_price
-- Run this in your Supabase SQL Editor

-- Add new columns for separate pricing
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS single_entry_price TEXT,
ADD COLUMN IF NOT EXISTS membership_price TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN gyms.single_entry_price IS 'Single entry/day pass price (e.g., "$20", "€15-25")';
COMMENT ON COLUMN gyms.membership_price IS 'Membership price (e.g., "$80/month", "€50/month")';

-- Optional: Attempt to migrate existing price_range data
-- This tries to parse existing price_range and split it intelligently
-- Note: This is a simple migration - you may need to manually review gyms with price_range set
UPDATE gyms 
SET single_entry_price = price_range
WHERE price_range IS NOT NULL 
  AND single_entry_price IS NULL
  AND membership_price IS NULL;

-- Note: price_range column is kept for backward compatibility but can be deprecated
-- You may want to drop it later after verifying all data has been migrated:
-- ALTER TABLE gyms DROP COLUMN IF EXISTS price_range;

-- Success message
SELECT 'Price columns split successfully! Added single_entry_price and membership_price columns.' as status;

