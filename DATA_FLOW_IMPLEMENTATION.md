# Data Flow Implementation Guide

## Overview

This document outlines the implementation of live data flows for community features including community join/leave, comment replies, and event RSVPs in Supabase.

## Fixed Issues

### 1. Column Name Inconsistencies ✅

**Problem**: The database schema used `parent_id` but the code expected `parent_comment_id`.

**Solution**: 
- Updated both `community-schema.sql` and `enhanced-community-schema.sql`
- Renamed `parent_id` to `parent_comment_id` in comments table
- Updated all indexes and references

### 2. Reply Count Tracking ✅

**Problem**: No tracking of reply counts for comments.

**Solution**:
- Added `reply_count` column to comments table
- Created `update_comment_reply_count()` function
- Added trigger to automatically update reply counts
- Updated UI to display reply counts from database

### 3. Event RSVP Persistence ✅

**Problem**: Event RSVPs were not being persisted to the database.

**Solution**:
- Implemented `handleEventRSVP()` function in community page
- Added RSVP state management with `eventRSVPs` Map
- Created proper RSVP status cycling (going → interested → cant_go → going)
- Updated EventCard component to use persisted RSVP data

## Database Schema Updates

### Comments Table
```sql
-- Added reply_count column
ALTER TABLE comments ADD COLUMN reply_count INTEGER DEFAULT 0;

-- Renamed parent_id to parent_comment_id
ALTER TABLE comments RENAME COLUMN parent_id TO parent_comment_id;

-- Added trigger for reply count updates
CREATE TRIGGER update_comment_reply_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();
```

### Event RSVPs Table
```sql
-- Already exists in enhanced schema
CREATE TABLE event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested' CHECK (status IN ('going', 'interested', 'cant_go')),
  rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

## Component Updates

### Community Page (`/app/community/[communityId]/page.jsx`)
- Added `eventRSVPs` state management
- Implemented `handleEventRSVP()` function
- Updated `loadEvents()` to fetch user RSVPs
- Connected EventCard components to RSVP functionality

### Comment Thread (`/app/components/CommentThread.jsx`)
- Updated to use `parent_comment_id` consistently
- Added reply count display from database
- Improved reply detection logic

### Post Detail Page (`/app/community/[communityId]/post/[postId]/page.jsx`)
- Fixed comment filtering to use `parent_comment_id`
- Updated comment organization logic

## Data Flow Architecture

### 1. Community Join/Leave Flow
```
User clicks Join/Leave
↓
handleJoinCommunity() / handleLeaveCommunity()
↓
Supabase: INSERT/DELETE from community_members
↓
Trigger: update_community_member_count()
↓
UI: Update member count display
```

### 2. Comment Reply Flow
```
User submits reply
↓
handleAddComment() with parent_comment_id
↓
Supabase: INSERT into comments
↓
Trigger: update_comment_reply_count()
↓
UI: Update reply count and display new reply
```

### 3. Event RSVP Flow
```
User clicks RSVP button
↓
handleEventRSVP() with status cycling
↓
Supabase: INSERT/UPDATE event_rsvps
↓
UI: Update button state and RSVP status
```

### 4. Like Counter Flow
```
User clicks like button
↓
handleLikePost() / handleLikeComment()
↓
Supabase: INSERT/DELETE from likes
↓
Trigger: update_post_like_count() / update_comment_like_count()
↓
UI: Update like count and button state
```

## Migration Instructions

### For Existing Databases

1. **Run the migration script**:
   ```sql
   -- Execute the contents of lib/migration-fix-columns.sql
   ```

2. **Verify the migration**:
   ```javascript
   import { verifySchema } from './lib/test-data-flows.js';
   await verifySchema();
   ```

### For New Databases

1. **Use the enhanced schema**:
   ```sql
   -- Execute lib/enhanced-community-schema.sql
   ```

2. **Or use the basic schema**:
   ```sql
   -- Execute lib/community-schema.sql
   ```

## Testing

### Manual Testing Checklist

- [ ] Join/leave communities updates member count
- [ ] Comment replies create proper parent-child relationships
- [ ] Reply counts update automatically
- [ ] Event RSVPs persist and cycle through states
- [ ] Like counts update for posts and comments
- [ ] Nested comment threads display correctly
- [ ] All data persists after page refresh

### Automated Testing

Use the test script:
```javascript
import { testDataFlows } from './lib/test-data-flows.js';
await testDataFlows();
```

## Performance Considerations

### Database Indexes
- `comments_parent_comment_id_idx` for efficient reply queries
- `posts_community_id_idx` for community post filtering
- `event_rsvps_event_id_idx` for RSVP lookups

### UI Optimizations
- Optimistic updates for immediate feedback
- Local state management to reduce database calls
- Efficient comment organization with Map structures

## Troubleshooting

### Common Issues

1. **Reply counts not updating**
   - Check if `update_comment_reply_count()` function exists
   - Verify trigger is created and active

2. **RSVPs not persisting**
   - Ensure `event_rsvps` table exists
   - Check RLS policies allow user operations

3. **Column name errors**
   - Run migration script to fix `parent_id` → `parent_comment_id`
   - Verify all components use correct column names

### Debug Commands

```sql
-- Check comment structure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'comments' AND column_name IN ('parent_comment_id', 'reply_count');

-- Check reply counts
SELECT id, content, reply_count, parent_comment_id 
FROM comments ORDER BY created_at DESC LIMIT 10;

-- Check RSVPs
SELECT e.title, er.status, er.user_id 
FROM events e 
LEFT JOIN event_rsvps er ON e.id = er.event_id;
```

## Next Steps

1. **Real-time Updates**: Implement Supabase realtime subscriptions
2. **Caching**: Add Redis caching for frequently accessed data
3. **Analytics**: Track engagement metrics
4. **Notifications**: Add push notifications for replies and RSVPs

## Success Metrics

- ✅ All column names consistent across schemas
- ✅ Reply counts update automatically
- ✅ Event RSVPs persist and cycle correctly
- ✅ Community membership updates member counts
- ✅ Nested comment threads work end-to-end
- ✅ Like counters update for all content types
