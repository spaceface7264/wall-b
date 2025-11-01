-- Add Missing Columns to gyms Table
-- Run this in your Supabase SQL Editor to fix the schema

-- Add facilities column (JSONB)
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb;

-- Add opening_hours column (JSONB)
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;

-- Add price_range column
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS price_range TEXT;

-- Add difficulty_levels column (TEXT array)
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS difficulty_levels TEXT[];

-- Add image_url column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add created_at if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments to document the columns
COMMENT ON COLUMN gyms.facilities IS 'Array of facility features (e.g., Cafe, Shop, Training Area, etc.)';
COMMENT ON COLUMN gyms.opening_hours IS 'Opening hours for each day of the week (JSONB object)';
COMMENT ON COLUMN gyms.price_range IS 'Price range (e.g., "€15-25", "$20-30")';
COMMENT ON COLUMN gyms.difficulty_levels IS 'Array of available difficulty levels';
COMMENT ON COLUMN gyms.image_url IS 'URL of the gym image';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS gyms_country_city_idx ON gyms(country, city);
CREATE INDEX IF NOT EXISTS gyms_name_idx ON gyms(name);

