-- Check posts table structure
-- Run this in your Supabase SQL Editor

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;


