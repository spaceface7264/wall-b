-- Simple Community ID Fix - Create New Communities with Professional IDs
-- Run this in your Supabase SQL Editor

-- Step 1: Check current communities
SELECT id, name, description, member_count FROM communities ORDER BY created_at;

-- Step 2: Create new communities with professional IDs
-- (We'll keep the old ones for now and migrate data)

-- Create new professional communities
INSERT INTO communities (id, name, description, member_count, created_at, updated_at)
VALUES 
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'The Climbing Hangar Community', 'Connect with fellow climbers at The Climbing Hangar in London. Share beta, organize meetups, and stay updated on gym events.', 156, NOW(), NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Boulder Central Community', 'Join the Boulder Central community in Berlin. Share your sends, get beta, and connect with local climbers.', 89, NOW(), NOW()),
('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Vertical World Community', 'The Vertical World community in Seattle. From beginners to pros, everyone is welcome to share and learn.', 234, NOW(), NOW());

-- Step 3: Migrate community_members to new communities
-- (This will create duplicate memberships, but that's okay for now)
INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT user_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', role, joined_at
FROM community_members 
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT user_id, '6ba7b810-9dad-11d1-80b4-00c04fd430c8', role, joined_at
FROM community_members 
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT user_id, '6ba7b811-9dad-11d1-80b4-00c04fd430c8', role, joined_at
FROM community_members 
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Step 4: Migrate posts to new communities
INSERT INTO posts (community_id, user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at)
SELECT 'f47ac10b-58cc-4372-a567-0e02b2c3d479', user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at
FROM posts 
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO posts (community_id, user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at)
SELECT '6ba7b810-9dad-11d1-80b4-00c04fd430c8', user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at
FROM posts 
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO posts (community_id, user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at)
SELECT '6ba7b811-9dad-11d1-80b4-00c04fd430c8', user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count, created_at, updated_at
FROM posts 
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Step 5: Migrate events to new communities
INSERT INTO events (community_id, created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at)
SELECT 'f47ac10b-58cc-4372-a567-0e02b2c3d479', created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at
FROM events 
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO events (community_id, created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at)
SELECT '6ba7b810-9dad-11d1-80b4-00c04fd430c8', created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at
FROM events 
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

INSERT INTO events (community_id, created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at)
SELECT '6ba7b811-9dad-11d1-80b4-00c04fd430c8', created_by, title, description, event_date, event_type, location, max_participants, created_at, updated_at
FROM events 
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Step 6: Verify the new communities exist
SELECT 'New professional communities created!' as status;
SELECT id, name, member_count FROM communities WHERE id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
) ORDER BY created_at;

-- Step 7: Check migrated data
SELECT 'Community members migrated:' as info, COUNT(*) as count FROM community_members WHERE community_id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
);

SELECT 'Posts migrated:' as info, COUNT(*) as count FROM posts WHERE community_id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
);

SELECT 'Events migrated:' as info, COUNT(*) as count FROM events WHERE community_id IN (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
);


