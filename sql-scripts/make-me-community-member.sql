-- Make current user a member of professional communities
-- Run this in your Supabase SQL Editor while logged in to the frontend

-- Add yourself as a member of all professional communities
INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

INSERT INTO community_members (user_id, community_id, role, joined_at)
SELECT 
    auth.uid(),
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    'admin',
    NOW()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, community_id) DO UPDATE SET role = 'admin';

-- Show your memberships
SELECT 'Your community memberships:' as info;
SELECT c.name, c.id, cm.role, cm.joined_at
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.user_id = auth.uid();

SELECT 'You are now a member of all professional communities!' as status;


