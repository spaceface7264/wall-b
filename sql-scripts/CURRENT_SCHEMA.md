# Current Database Schema Documentation

**Last Updated:** October 28, 2025  
**Purpose:** This document represents the CURRENT WORKING database schema. This is the single source of truth for the database structure.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Community Tables](#community-tables)
3. [Gym Tables](#gym-tables)
4. [Chat/Messaging Tables](#chatmessaging-tables)
5. [Event Tables](#event-tables)
6. [Storage & Media](#storage--media)
7. [Functions & Triggers](#functions--triggers)
8. [RLS Policies Summary](#rls-policies-summary)

---

## Core Tables

### profiles
Extended user profile information. Automatically created when a user signs up.

**Columns:**
- `id` (UUID, PK, FK → auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `bio` (TEXT)
- `avatar_url` (TEXT)
- `company` (TEXT)
- `role` (TEXT)
- `climbing_grade` (TEXT) - e.g., "5.12a", "V6"
- `years_climbing` (INTEGER, default: 0)
- `favorite_style` (TEXT) - e.g., "bouldering", "sport", "trad"
- `home_gym_id` (UUID, FK → gyms.id)
- `instagram_url` (TEXT)
- `twitter_url` (TEXT)
- `website_url` (TEXT)
- `show_email` (BOOLEAN, default: FALSE)
- `show_activity` (BOOLEAN, default: TRUE)
- `allow_direct_messages` (BOOLEAN, default: TRUE)
- `posts_count` (INTEGER, default: 0) - Auto-updated via triggers
- `comments_count` (INTEGER, default: 0) - Auto-updated via triggers
- `events_attended_count` (INTEGER, default: 0)
- `likes_given_count` (INTEGER, default: 0) - Auto-updated via triggers
- `likes_received_count` (INTEGER, default: 0) - Auto-updated via triggers
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `last_active_at` (TIMESTAMPTZ)

**Indexes:**
- `profiles_email_idx`
- `profiles_full_name_idx`
- `profiles_home_gym_id_idx`
- `profiles_last_active_at_idx`

---

## Community Tables

### posts
Community posts shared by users. Can be associated with a community.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `user_email` (TEXT, NOT NULL) - Denormalized for quick access
- `user_name` (TEXT, NOT NULL) - Denormalized for quick access
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `community_id` (UUID, FK → communities.id) - Optional, for gym-specific posts
- `tag` (TEXT, default: 'general')
- `post_type` (TEXT, default: 'post') - CHECK: 'post', 'beta', 'event', 'question', 'gear', 'training', 'social'
- `is_pinned` (BOOLEAN, default: FALSE)
- `is_featured` (BOOLEAN, default: FALSE)
- `like_count` (INTEGER, default: 0) - Auto-updated via triggers
- `comment_count` (INTEGER, default: 0) - Auto-updated via triggers
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `posts_created_at_idx` (DESC)
- `posts_user_id_idx`
- `posts_community_id_idx`
- `posts_tag_idx`
- `posts_post_type_idx`

### comments
Comments on posts with support for nested replies.

**Columns:**
- `id` (UUID, PK)
- `post_id` (UUID, FK → posts.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `user_email` (TEXT, NOT NULL) - Denormalized
- `user_name` (TEXT, NOT NULL) - Denormalized
- `content` (TEXT, NOT NULL)
- `parent_comment_id` (UUID, FK → comments.id) - For nested replies
- `like_count` (INTEGER, default: 0) - Auto-updated via triggers
- `reply_count` (INTEGER, default: 0) - Auto-updated via triggers
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `comments_post_id_idx`
- `comments_user_id_idx`
- `comments_parent_comment_id_idx`

### likes
User likes on posts and comments.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `post_id` (UUID, FK → posts.id) - One of post_id or comment_id must be set
- `comment_id` (UUID, FK → comments.id)
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, post_id)
- UNIQUE(user_id, comment_id)

**Indexes:**
- `likes_post_id_idx`
- `likes_comment_id_idx`
- `likes_user_id_idx`

### communities
Gym-specific communities (one per gym).

**Columns:**
- `id` (UUID, PK)
- `gym_id` (UUID, FK → gyms.id, NOT NULL)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `member_count` (INTEGER, default: 0) - Auto-updated via triggers
- `is_active` (BOOLEAN, default: TRUE)
- `rules` (TEXT) - Community guidelines
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(gym_id) - One community per gym

**Indexes:**
- `communities_gym_id_idx`

### community_members
Membership records for users in communities.

**Columns:**
- `id` (UUID, PK)
- `community_id` (UUID, FK → communities.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `joined_at` (TIMESTAMPTZ)
- `role` (TEXT, default: 'member') - CHECK: 'member', 'moderator', 'admin'

**Constraints:**
- UNIQUE(community_id, user_id)

**Indexes:**
- `community_members_community_id_idx`
- `community_members_user_id_idx`

### post_tags
Flexible tagging system for posts.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL, UNIQUE)
- `color` (TEXT, default: '#3b82f6')
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

### post_media
Multiple images/videos per post.

**Columns:**
- `id` (UUID, PK)
- `post_id` (UUID, FK → posts.id, NOT NULL)
- `media_url` (TEXT, NOT NULL)
- `media_type` (TEXT, NOT NULL) - CHECK: 'image', 'video'
- `caption` (TEXT)
- `order_index` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `post_media_post_id_idx`

### user_badges
Achievement badges for users.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `badge_type` (TEXT, NOT NULL)
- `badge_name` (TEXT, NOT NULL)
- `badge_description` (TEXT)
- `badge_icon` (TEXT, default: '🏆')
- `earned_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, badge_type)

**Indexes:**
- `user_badges_user_id_idx`

### reactions
Emoji reactions on posts and comments (alternative to likes).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `post_id` (UUID, FK → posts.id)
- `comment_id` (UUID, FK → comments.id)
- `reaction_type` (TEXT, NOT NULL) - CHECK: '👍', '❤️', '🔥', '💪', '🎉', '😮', '😢', '😡'
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, post_id, reaction_type)
- UNIQUE(user_id, comment_id, reaction_type)
- CHECK: (post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)

**Indexes:**
- `reactions_post_id_idx`
- `reactions_comment_id_idx`

---

## Gym Tables

### gyms
Gym/climbing facility information.

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL)
- `city` (TEXT, NOT NULL)
- `address` (TEXT, NOT NULL)
- `phone` (TEXT)
- `email` (TEXT)
- `website` (TEXT)
- `description` (TEXT)
- `image_url` (TEXT)
- `facilities` (JSONB, default: '[]') - Array of facility features
- `opening_hours` (JSONB, default: '{}') - Opening hours per day
- `price_range` (TEXT) - e.g., "€15-25"
- `difficulty_levels` (TEXT[]) - Array of available difficulty levels
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `gyms_country_city_idx`
- `gyms_name_idx`

### gym_images
Multiple images per gym.

**Columns:**
- `id` (UUID, PK)
- `gym_id` (UUID, FK → gyms.id, NOT NULL)
- `image_url` (TEXT, NOT NULL)
- `caption` (TEXT)
- `is_primary` (BOOLEAN, default: FALSE)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `gym_images_gym_id_idx`
- `gym_images_primary_idx` (partial, WHERE is_primary = TRUE)

### gym_reviews
User reviews of gyms.

**Columns:**
- `id` (UUID, PK)
- `gym_id` (UUID, FK → gyms.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `user_name` (TEXT, NOT NULL)
- `rating` (INTEGER, NOT NULL) - CHECK: 1-5
- `review_text` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(gym_id, user_id)

**Indexes:**
- `gym_reviews_gym_id_idx`
- `gym_reviews_user_id_idx`
- `gym_reviews_rating_idx`

### user_favorite_gyms
User's favorite gym bookmarks.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `gym_id` (UUID, FK → gyms.id, NOT NULL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(user_id, gym_id)

**Indexes:**
- `idx_user_favorite_gyms_user_id`
- `idx_user_favorite_gyms_gym_id`

### gym_requests
User-submitted requests to add new gyms.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `gym_name` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL)
- `city` (TEXT, NOT NULL)
- `address` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `website` (TEXT)
- `description` (TEXT)
- `status` (TEXT, default: 'pending') - CHECK: 'pending', 'approved', 'rejected'
- `created_at` (TIMESTAMPTZ)
- `reviewed_at` (TIMESTAMPTZ)
- `reviewed_by` (UUID, FK → auth.users)

**Indexes:**
- `gym_requests_user_id_idx`
- `gym_requests_status_idx`
- `gym_requests_created_at_idx` (DESC)

---

## Chat/Messaging Tables

### conversations
Chat conversation threads (direct or group).

**Columns:**
- `id` (UUID, PK)
- `title` (TEXT) - Optional group chat title
- `is_group` (BOOLEAN, default: FALSE) - OR `type` (TEXT, default: 'direct') - CHECK: 'direct', 'group'
- `created_by` (UUID, FK → auth.users, NOT NULL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `last_message_at` (TIMESTAMPTZ) - Auto-updated via triggers

**Indexes:**
- `conversations_created_by_idx`
- `conversations_last_message_at_idx` (DESC)
- `conversations_type_idx` (if using type column)

### conversation_participants
Users participating in conversations.

**Columns:**
- `id` (UUID, PK)
- `conversation_id` (UUID, FK → conversations.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `joined_at` (TIMESTAMPTZ)
- `last_read_at` (TIMESTAMPTZ)
- `is_active` (BOOLEAN, default: TRUE) - For leaving group chats

**Constraints:**
- UNIQUE(conversation_id, user_id)

**Indexes:**
- `conversation_participants_conversation_id_idx`
- `conversation_participants_user_id_idx`

### direct_messages
Messages within conversations.

**Columns:**
- `id` (UUID, PK)
- `conversation_id` (UUID, FK → conversations.id, NOT NULL)
- `sender_id` (UUID, FK → auth.users, NOT NULL)
- `content` (TEXT, NOT NULL) - OR `message` (TEXT, NOT NULL)
- `message_type` (TEXT, default: 'text') - CHECK: 'text', 'image', 'file', 'system'
- `media_url` (TEXT) - For images/files
- `file_url` (TEXT) - Alternative column name
- `reply_to_id` (UUID, FK → direct_messages.id)
- `is_edited` (BOOLEAN, default: FALSE)
- `edited_at` (TIMESTAMPTZ)
- `read_by` (JSONB, default: '{}') - Alternative tracking method
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `direct_messages_conversation_id_idx`
- `direct_messages_sender_id_idx`
- `direct_messages_created_at_idx` (DESC)
- `direct_messages_conversation_id_created_at_idx`

### message_read_status
Track which users have read which messages (alternative to read_by JSONB).

**Columns:**
- `id` (UUID, PK)
- `message_id` (UUID, FK → direct_messages.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `read_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(message_id, user_id)

**Indexes:**
- `message_read_status_message_id_idx`
- `message_read_status_user_id_idx`

### messages
Simple messages table (legacy/alternative to direct_messages).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL)
- `user_email` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `messages_created_at_idx`
- `messages_user_id_idx`

---

## Event Tables

### events
Community events and meetups.

**Columns:**
- `id` (UUID, PK)
- `community_id` (UUID, FK → communities.id, NOT NULL)
- `created_by` (UUID, FK → auth.users, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `event_date` (TIMESTAMPTZ, NOT NULL)
- `event_type` (TEXT, default: 'meetup') - CHECK: 'meetup', 'competition', 'training', 'social'
- `location` (TEXT) - Specific location within gym or external
- `max_participants` (INTEGER)
- `is_recurring` (BOOLEAN, default: FALSE)
- `recurrence_pattern` (TEXT) - 'weekly', 'monthly', etc.
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `events_community_id_idx`
- `events_event_date_idx`

### event_rsvps
User RSVPs for events.

**Columns:**
- `id` (UUID, PK)
- `event_id` (UUID, FK → events.id, NOT NULL)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `status` (TEXT, default: 'interested') - CHECK: 'going', 'interested', 'cant_go'
- `rsvp_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(event_id, user_id)

**Indexes:**
- `event_rsvps_event_id_idx`

---

## Notifications Table

### notifications
User notifications for various activities.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, NOT NULL)
- `type` (TEXT, NOT NULL) - CHECK: 'comment_reply', 'post_like', 'comment_like', 'event_invite', 'event_reminder', 'mention', 'direct_message', 'community_join', 'event_rsvp', 'post_comment', 'system'
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `data` (JSONB, default: '{}') - Additional context like post_id, comment_id, etc.
- `is_read` (BOOLEAN, default: FALSE)
- `read_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ) - For temporary notifications

**Indexes:**
- `notifications_user_id_idx`
- `notifications_type_idx`
- `notifications_is_read_idx`
- `notifications_created_at_idx` (DESC)
- `notifications_user_unread_idx` (partial, WHERE is_read = FALSE)

---

## Storage & Media

### Storage Buckets
- `avatars` - User profile pictures (public read, user can upload/update/delete own)
- `post-media` - Post images and videos (public read, authenticated users can upload)

---

## Functions & Triggers

### Profile Functions

#### handle_new_user()
Automatically creates a profile when a user signs up. Triggered on INSERT to auth.users.

#### update_profile_activity_counters()
Updates profile counters (posts_count, comments_count, likes_given_count, likes_received_count) when related records change.

**Triggers:**
- `update_profile_posts_count` - After INSERT/DELETE on posts
- `update_profile_comments_count` - After INSERT/DELETE on comments
- `update_profile_likes_count` - After INSERT/DELETE on likes

#### update_last_active()
Updates `last_active_at` when user performs actions.

**Triggers:**
- `update_profile_last_active_posts` - After INSERT on posts
- `update_profile_last_active_comments` - After INSERT on comments

### Community Functions

#### update_post_like_count()
Updates `like_count` on posts when likes are added/removed.

#### update_comment_like_count()
Updates `like_count` on comments when likes are added/removed.

#### update_post_comment_count()
Updates `comment_count` on posts when comments are added/removed.

#### update_comment_reply_count()
Updates `reply_count` on comments when replies are added/removed.

**Triggers:**
- `update_post_like_count_trigger` - After INSERT/DELETE on likes
- `update_comment_like_count_trigger` - After INSERT/DELETE on likes
- `update_post_comment_count_trigger` - After INSERT/DELETE on comments
- `update_comment_reply_count_trigger` - After INSERT/DELETE on comments
- `update_community_member_count_trigger` - After INSERT/DELETE on community_members

#### update_community_member_count()
Updates `member_count` on communities when members join/leave.

### Chat Functions

#### update_conversation_last_message()
Updates `last_message_at` and `updated_at` on conversations when new messages are sent.

**Triggers:**
- `update_conversation_on_message` - After INSERT on direct_messages

#### create_direct_conversation(user1_id UUID, user2_id UUID)
Creates or returns existing direct conversation between two users.

#### get_unread_message_count(user_id UUID)
Returns count of unread messages for a user.

### Notification Functions

#### create_notification(target_user_id, notification_type, notification_title, notification_message, notification_data, expires_in_hours)
Creates a notification with optional expiration.

#### mark_notification_read(notification_id UUID)
Marks a single notification as read.

#### mark_all_notifications_read()
Marks all notifications for the current user as read.

#### get_unread_notification_count()
Returns count of unread notifications for the current user.

#### cleanup_expired_notifications()
Deletes expired notifications (should be run periodically).

**Triggers:**
- `notify_comment_reply_trigger` - After INSERT on comments (when parent_comment_id IS NOT NULL)
- `notify_like_trigger` - After INSERT on likes
- `notify_event_rsvp_trigger` - After INSERT on event_rsvps

#### notify_comment_reply()
Creates notifications when someone replies to a comment.

#### notify_like()
Creates notifications when someone likes a post or comment.

#### notify_event_rsvp()
Creates notifications when someone RSVPs to an event.

### Storage Functions

#### generate_avatar_filename(user_id UUID, file_extension TEXT)
Generates unique filename for avatar uploads.

#### generate_post_media_filename(user_id UUID, post_id UUID, file_extension TEXT)
Generates unique filename for post media uploads.

---

## RLS Policies Summary

All tables have RLS enabled. Key policies:

- **profiles**: Authenticated users can view all, update own
- **posts**: Authenticated users can read all, create/update/delete own
- **comments**: Authenticated users can read all, create/update/delete own
- **likes**: Authenticated users can read all, create own, delete own
- **communities**: Authenticated users can read all, create own
- **community_members**: Authenticated users can read all, join/leave own
- **events**: Authenticated users can read all, members can create
- **event_rsvps**: Authenticated users can read all, manage own
- **conversations**: Users can view conversations they participate in
- **direct_messages**: Users can view/send messages in their conversations
- **notifications**: Users can only view/update their own
- **gyms**: Public read, authenticated users can create/update/delete
- **gym_reviews**: Public read, users can create/update/delete own
- **gym_requests**: Users view own, create own; admins can view/update all

---

## Notes

1. **Schema Consistency**: Some tables may have slight variations (e.g., `conversations.type` vs `conversations.is_group`, `direct_messages.message` vs `direct_messages.content`). The current working version uses the schema defined in `lib/direct-messages-schema.sql`.

2. **Denormalization**: Some tables (posts, comments) store `user_email` and `user_name` directly for performance, as these don't change frequently.

3. **Dual Tracking**: Some features have dual implementations (e.g., `read_by` JSONB in direct_messages vs `message_read_status` table). The current implementation uses the table-based approach for better query performance.

4. **Migration History**: All previous "fix" scripts have been archived. New changes should be made via the migrations system.

5. **Storage Setup**: Storage buckets must be created manually via Supabase Dashboard before RLS policies can be applied.

