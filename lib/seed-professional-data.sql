-- Professional Seed Data with Proper UUIDs
-- Run this in your Supabase SQL Editor to replace placeholder data

-- Clear existing data (be careful in production!)
DELETE FROM events WHERE community_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

DELETE FROM community_members WHERE community_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

DELETE FROM posts WHERE community_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Update communities with professional UUIDs
UPDATE communities 
SET id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE communities 
SET id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE communities 
SET id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update community_members
UPDATE community_members 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE community_members 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE community_members 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update posts
UPDATE posts 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE posts 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE posts 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update events
UPDATE events 
SET community_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
WHERE community_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE events 
SET community_id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE events 
SET community_id = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
WHERE community_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update gyms with professional UUIDs
UPDATE gyms 
SET id = '550e8400-e29b-41d4-a716-446655440000'
WHERE id = 1;

UPDATE gyms 
SET id = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = 2;

UPDATE gyms 
SET id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id = 3;

-- Add some sample events with professional UUIDs
INSERT INTO events (id, community_id, created_by, title, description, event_date, event_type, location, max_participants) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '123e4567-e89b-12d3-a456-426614174000', 'Weekly Climbing Meetup', 'Join us for our weekly climbing session! All levels welcome.', NOW() + INTERVAL '2 days', 'meetup', 'Main Climbing Area', 20),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '123e4567-e89b-12d3-a456-426614174001', 'Boulder Competition', 'Monthly boulder competition with prizes!', NOW() + INTERVAL '7 days', 'competition', 'Competition Wall', 50),
('c3d4e5f6-g7h8-9012-cdef-345678901234', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', '123e4567-e89b-12d3-a456-426614174002', 'Technique Workshop', 'Learn advanced climbing techniques from our pros.', NOW() + INTERVAL '3 days', 'training', 'Training Room', 15);

-- Add some sample posts
INSERT INTO posts (id, community_id, user_id, user_name, user_email, title, content, tag, post_type, like_count, comment_count) VALUES
('d4e5f6g7-h8i9-0123-defg-456789012345', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '123e4567-e89b-12d3-a456-426614174000', 'Alex Climber', 'alex@example.com', 'New Route Beta', 'Check out this amazing new route on the main wall!', 'beta', 'post', 5, 2),
('e5f6g7h8-i9j0-1234-efgh-567890123456', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '123e4567-e89b-12d3-a456-426614174001', 'Sarah Boulder', 'sarah@example.com', 'Gym Hours Update', 'Just a heads up - we''re extending weekend hours!', 'news', 'post', 3, 1);

-- Verify the changes
SELECT 'Professional UUIDs applied successfully!' as status;
SELECT id, name FROM communities ORDER BY created_at;
SELECT id, title FROM events ORDER BY created_at;
SELECT id, title FROM posts ORDER BY created_at;


