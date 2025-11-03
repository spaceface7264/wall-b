-- Fix community IDs to use proper UUIDs
-- Run this in your Supabase SQL Editor

-- First, let's see what we have
SELECT id, name FROM communities ORDER BY created_at;

-- Step 1: Update foreign key references FIRST (before updating main table)
-- Update community_members table to reference new IDs
UPDATE community_members 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE community_members 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE community_members 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update any posts that might reference old community IDs
UPDATE posts 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE posts 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE posts 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update any events that might reference old community IDs
UPDATE events 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE events 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE events 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update any comments that might reference old community IDs
UPDATE comments 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE comments 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE comments 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update any likes that might reference old community IDs
UPDATE likes 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE likes 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE likes 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Step 2: NOW update the main communities table
UPDATE communities 
SET id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE communities 
SET id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE communities 
SET id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Verify the changes
SELECT id, name, member_count FROM communities ORDER BY created_at;
