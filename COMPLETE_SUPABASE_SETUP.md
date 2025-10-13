# Complete Supabase Setup Guide

This guide will help you set up all the necessary database tables, storage buckets, and security policies for the Wall-B community app.

## Prerequisites

- Supabase project created
- Supabase project URL and anon key
- Access to Supabase Dashboard

## Setup Steps

### 1. Database Schema Setup

Run the following SQL files in your Supabase SQL Editor in this exact order:

#### Step 1.1: Core Tables
```sql
-- Run these in order:
1. lib/gyms-schema.sql
2. lib/community-schema.sql  
3. lib/messages-schema.sql
4. lib/enhanced-community-schema.sql
```

#### Step 1.2: New Features
```sql
-- Run these in order:
5. lib/profiles-schema.sql
6. lib/direct-messages-schema.sql
7. lib/notifications-schema.sql
8. lib/add-missing-rls-policies.sql
```

#### Step 1.3: Storage Setup
```sql
-- Run this last:
9. lib/storage-setup.sql
```

### 2. Storage Buckets Setup

#### Step 2.1: Create Storage Buckets
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create the following buckets:

**Bucket 1: `avatars`**
- Name: `avatars`
- Public: ✅ **Yes** (checked)
- File size limit: 5MB
- Allowed MIME types: `image/*`

**Bucket 2: `post-media`**
- Name: `post-media`
- Public: ✅ **Yes** (checked)
- File size limit: 10MB
- Allowed MIME types: `image/*,video/*`

### 3. Environment Variables

Ensure your `.env.local` file contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Verification Steps

#### Step 4.1: Check Database Tables
Run this query in your Supabase SQL Editor to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `communities`
- `community_members`
- `conversations`
- `conversation_participants`
- `direct_messages`
- `events`
- `event_rsvps`
- `gyms`
- `gym_images`
- `gym_reviews`
- `likes`
- `message_read_status`
- `messages`
- `notifications`
- `post_media`
- `post_tags`
- `posts`
- `profiles`
- `reactions`
- `user_badges`

#### Step 4.2: Check RLS Policies
Run this query to verify RLS is enabled on all tables:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

#### Step 4.3: Check Storage Buckets
1. Go to **Storage** in your Supabase Dashboard
2. Verify both `avatars` and `post-media` buckets exist
3. Check that they are set to public

#### Step 4.4: Test Profile Creation
1. Sign up a new user in your app
2. Check that a profile record was automatically created in the `profiles` table
3. Verify the profile has the correct user_id

#### Step 4.5: Test Avatar Upload
1. Go to the profile page
2. Try uploading an avatar image
3. Verify the image appears in the `avatars` bucket
4. Check that the profile's `avatar_url` is updated

### 5. Features Now Available

After completing this setup, your app will have:

#### ✅ **Profile Management**
- Extended user profiles with climbing stats
- Avatar upload and management
- Activity counters (posts, comments, likes)
- Privacy settings
- Social links

#### ✅ **Community Features**
- Community creation and management
- Post creation with media attachments
- Nested comment system (2 levels)
- Like and reaction system
- Event creation and RSVP management
- User badges and achievements

#### ✅ **Chat System**
- Public community chat
- Private direct messages
- Group conversations
- Message read status
- Real-time messaging

#### ✅ **Notifications**
- Comment reply notifications
- Like notifications
- Event RSVP notifications
- Direct message notifications
- System notifications

#### ✅ **Storage**
- Profile picture storage
- Post media storage
- Proper access controls

### 6. Troubleshooting

#### Issue: Avatar upload fails
**Solution:** 
1. Verify `avatars` bucket exists and is public
2. Check RLS policies for storage.objects
3. Ensure user is authenticated

#### Issue: Notifications not working
**Solution:**
1. Verify triggers are created (check `notifications-schema.sql`)
2. Check that RLS policies allow notification creation
3. Test with a simple notification creation

#### Issue: Direct messages not working
**Solution:**
1. Verify `conversations` and `direct_messages` tables exist
2. Check RLS policies for these tables
3. Ensure users are authenticated

#### Issue: RLS blocking queries
**Solution:**
1. Run `lib/add-missing-rls-policies.sql`
2. Check that all tables have appropriate policies
3. Verify user authentication status

### 7. Maintenance

#### Clean up expired notifications
Run this query periodically to clean up old notifications:

```sql
SELECT cleanup_expired_notifications();
```

#### Monitor storage usage
Check your Supabase Dashboard > Storage for bucket usage and consider implementing cleanup policies for old files.

#### Update activity counters
The triggers should automatically update activity counters, but you can manually recalculate them if needed:

```sql
-- This would need to be implemented based on your specific needs
-- Example: Recalculate all post counts
UPDATE profiles 
SET posts_count = (
  SELECT COUNT(*) 
  FROM posts 
  WHERE posts.user_id = profiles.id
);
```

## Support

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify all SQL files were run successfully
3. Ensure environment variables are correct
4. Check that RLS policies are properly configured

The app should now be fully functional with all community, chat, and profile features working end-to-end!
