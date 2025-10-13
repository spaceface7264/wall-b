-- Safe Community ID Fix - Handles Foreign Key Constraints Properly
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's see what we have
SELECT id, name FROM communities ORDER BY created_at;

-- Step 2: Create temporary mapping table
CREATE TEMP TABLE community_id_mapping (
    old_id UUID,
    new_id UUID,
    name TEXT
);

-- Insert the mappings
INSERT INTO community_id_mapping (old_id, new_id, name) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'The Climbing Hangar Community'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Boulder Central Community'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Vertical World Community');

-- Step 3: Temporarily disable foreign key constraints
-- (Note: This might not work in all Supabase setups, so we'll use a different approach)

-- Step 4: Create new communities with professional IDs
INSERT INTO communities (id, name, description, member_count, created_at, updated_at)
SELECT 
    m.new_id,
    m.name,
    c.description,
    c.member_count,
    c.created_at,
    NOW()
FROM communities c
JOIN community_id_mapping m ON c.id = m.old_id;

-- Step 5: Update all foreign key references to point to new IDs
UPDATE community_members 
SET community_id = m.new_id
FROM community_id_mapping m
WHERE community_members.community_id = m.old_id;

UPDATE posts 
SET community_id = m.new_id
FROM community_id_mapping m
WHERE posts.community_id = m.old_id;

UPDATE events 
SET community_id = m.new_id
FROM community_id_mapping m
WHERE events.community_id = m.old_id;

UPDATE comments 
SET community_id = m.new_id
FROM community_id_mapping m
WHERE comments.community_id = m.old_id;

UPDATE likes 
SET community_id = m.new_id
FROM community_id_mapping m
WHERE likes.community_id = m.old_id;

-- Step 6: Delete old communities (now that all references point to new ones)
DELETE FROM communities 
WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Step 7: Clean up
DROP TABLE community_id_mapping;

-- Step 8: Verify the changes
SELECT id, name, member_count FROM communities ORDER BY created_at;
SELECT 'Community IDs updated successfully!' as status;


