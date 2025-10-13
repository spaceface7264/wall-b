# Supabase Community Forum Setup Guide

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run the SQL Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase-community-schema.sql`
4. Click **Run** to execute the schema

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `communities` | Community groups tied to gyms | Member counts, rules, gym relationships |
| `gyms` | Physical climbing gyms | Location data, contact info, descriptions |
| `posts` | Forum posts | Tags, types, like/comment counts |
| `comments` | Nested comments (2 levels) | Reply system, like counts |
| `likes` | User likes for posts/comments | Optimistic updates |
| `community_members` | User memberships | Roles, join dates |

### Extended Features

| Table | Purpose |
|-------|---------|
| `events` | Community events and meetups |
| `event_rsvps` | Event attendance tracking |
| `notifications` | User notifications |
| `reactions` | Emoji reactions |
| `user_badges` | Gamification system |
| `post_media` | Image/video attachments |
| `post_tags` | Additional tagging system |

## 🔒 Security Features

### Row Level Security (RLS)
- **Communities**: Public read, authenticated create
- **Posts**: Public read, user can edit/delete own
- **Comments**: Public read, user can edit/delete own
- **Likes**: Public read, user can manage own
- **Events**: Public read, user can manage own

### Data Validation
- Check constraints on enums (post types, tags, roles)
- Unique constraints prevent duplicate likes
- Foreign key relationships ensure data integrity

## ⚡ Performance Optimizations

### Indexes
- **Posts**: Community, user, created_at, tag, type
- **Comments**: Post, parent, user, created_at, depth
- **Likes**: User, post, comment
- **Communities**: Gym, created_at, active status

### Automatic Updates
- **Triggers** update counts automatically
- **Member counts** update on join/leave
- **Like counts** update on like/unlike
- **Comment counts** update on comment add/delete

## 🔧 Helper Functions

### Built-in Queries
```sql
-- Get posts for a community with pagination
SELECT * FROM get_community_posts('community-uuid', 20, 0, 'beta');

-- Get comments for a post with nested structure
SELECT * FROM get_post_comments('post-uuid');
```

### Useful Views
- `posts_with_details` - Posts with user and community info
- `comments_with_details` - Comments with user info
- `community_stats` - Community statistics and metrics

## 📱 Frontend Integration

### Replace Mock Data
Update your components to use Supabase instead of mock data:

```javascript
// Before (mock data)
import { getAllPosts } from '../lib/mockCommunityData';

// After (Supabase)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get posts
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('community_id', communityId)
  .order('created_at', { ascending: false });
```

### Real-time Subscriptions
```javascript
// Listen for new posts
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      // Update UI with new post
    }
  )
  .subscribe();
```

## 🧪 Sample Data

The schema includes sample data for testing:
- 3 gyms (London, Berlin, Seattle)
- 3 communities (one per gym)
- Ready for immediate testing

## 🔄 Migration from Mock Data

### Step 1: Update Data Layer
Replace `lib/mockCommunityData.js` with Supabase calls:

```javascript
// lib/supabaseCommunityData.js
export const getAllPosts = async (communityId) => {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId);
  return data || [];
};
```

### Step 2: Update Components
Replace mock data imports with Supabase calls in:
- `app/community/[communityId]/page.jsx`
- `app/community/[communityId]/post/[postId]/page.jsx`
- All comment and post components

### Step 3: Add Real-time Features
Implement real-time subscriptions for:
- New posts
- New comments
- Like updates
- Member joins

## 🚨 Important Notes

### Authentication
- Users must be authenticated to create content
- RLS policies enforce user ownership
- Anonymous users can only read public content

### Data Types
- All IDs are UUIDs
- Timestamps are timezone-aware
- JSONB used for flexible data storage

### Limits
- Post title: 200 characters
- Post content: No limit (use TEXT)
- Comment content: No limit (use TEXT)
- Max comment depth: 2 levels

## 🎯 Next Steps

1. **Run the SQL schema** in your Supabase dashboard
2. **Update environment variables** with your Supabase credentials
3. **Replace mock data** with Supabase calls
4. **Test all features** with real data
5. **Add real-time subscriptions** for live updates
6. **Deploy and monitor** performance

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify RLS policies are enabled
3. Ensure environment variables are correct
4. Test queries in the SQL editor

The schema is production-ready and includes all features needed for a full-featured community forum! 🚀

