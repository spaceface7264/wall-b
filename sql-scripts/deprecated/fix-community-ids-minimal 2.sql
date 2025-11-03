-- Minimal Community ID Fix - Just Create New Professional Communities
-- Run this in your Supabase SQL Editor

-- Step 1: Check current communities
SELECT id, name, description, member_count FROM communities ORDER BY created_at;

-- Step 2: Create new communities with professional IDs
INSERT INTO communities (id, name, description, member_count, created_at, updated_at)
VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'The Climbing Hangar Community', 'Connect with fellow climbers at The Climbing Hangar in London. Share beta, organize meetups, and stay updated on gym events.', 156, NOW(), NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Boulder Central Community', 'Join the Boulder Central community in Berlin. Share your sends, get beta, and connect with local climbers.', 89, NOW(), NOW()),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Vertical World Community', 'The Vertical World community in Seattle. From beginners to pros, everyone is welcome to share and learn.', 234, NOW(), NOW());

-- Step 3: Verify the new communities were created
SELECT 'New professional communities created!' as status;
SELECT id, name, member_count FROM communities WHERE id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
) ORDER BY created_at;

-- Step 4: Check if we can add some sample members
-- (This will only work if you have users in the system)
INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'member',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO NOTHING;

-- Step 5: Show all communities (old and new)
SELECT 'All communities (including new professional ones):' as info;
SELECT id, name, member_count, created_at FROM communities ORDER BY created_at;


