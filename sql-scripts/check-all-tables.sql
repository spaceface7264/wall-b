-- Check all table structures to understand the schema
-- Run this in your Supabase SQL Editor

-- Check posts table
SELECT 'POSTS TABLE:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Check communities table
SELECT 'COMMUNITIES TABLE:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'communities' 
ORDER BY ordinal_position;

-- Check events table
SELECT 'EVENTS TABLE:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Check community_members table
SELECT 'COMMUNITY_MEMBERS TABLE:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'community_members' 
ORDER BY ordinal_position;


