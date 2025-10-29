# Changelog

This document consolidates all historical fixes and changes made to the Wall-B project. All fix documentation has been consolidated here to avoid confusion from multiple overlapping documents.

---

## Recent Fixes & Solutions

### Chat RLS Policies Fix
**Date:** December 2024  
**Related Files:** `sql-scripts/chat/fix-all-chat-rls-policies.sql`

**Problem:**  
Chat system experienced multiple RLS (Row Level Security) policy issues:
- Group members not loading due to recursive RLS policies in `conversation_participants` table
- Messages not loading due to recursive RLS policies in `direct_messages` table
- Conversations not loading due to recursive Links policies in `conversations` table

**Root Cause:**  
All three tables had RLS policies that created recursive dependencies:
- `conversation_participants` policy checked if user is participant by querying the same table
- `direct_messages` policy checked participation via `conversation_participants` (which had recursive policy)
- `conversations` policy checked participation via `conversation_participants` (which had recursive policy)

This created circular dependencies causing Supabase to return empty results or fail silently.

**Solution:**  
Simplified RLS policies to be non-recursive:
- Dropped all problematic recursive policies
- Created simple policies requiring authentication (`auth.uid() IS NOT NULL`)
- Moved access control to application level
- Added helper functions for additional security checks

**Files Modified:**
- `sql-scripts/chat/fix-all-chat-rls-policies.sql`
- `app/components/ConversationView.jsx`
- `app/components/GroupMembersModal.jsx`

---

### Group Members Loading Error Fix
**Date:** December 2024  
**Related Files:** `sql-scripts/chat/fix-conversation-participants-rls.sql`

**Problem:**  
GroupMembersModal component failed to load group members with empty error object `{}` due to RLS policy issues.

**Root Cause:**  
Recursive dependency in RLS policy for `conversation_participants` table - policy checked participation by querying the same table.

**Solution:**  
- Fixed RLS policies to avoid recursive dependencies
- Enhanced error handling with detailed logging
- Added fallback query approach in component
- Better error messages for users

**Files Modified:**
- `app/components/GroupMembersModal.jsx`
- `app/components/ConversationView.jsx`
- `sql-scripts/chat/fix-conversation-participants-rls.sql`

---

### Posts Loading and RLS Issues Fix
**Date:** December 2024  
**Related Files:** `sql-scripts/fix-posts-profiles-join.sql`

**Problem:**  
1. Posts disappeared when queries were updated to join with `profiles` table - RLS policies blocked access
2. Next.js build errors from corrupted build cache
3. User names showing incorrectly ("Unknown User", "Anonymous", or email instead of nicknames)

**Root Causes:**  
1. **RLS Policy Conflict:** `posts` table had permissive RLS policies, but `profiles` table had restrictive policies requiring authentication. When joining `posts` with `profiles`, the restrictive `profiles` policy blocked the entire query.
2. **Build Cache Corruption:** Multiple lockfiles, corrupted `.next` build cache, Turbopack configuration conflicts.

**Solution:**  
1. **Fixed RLS Policies:** Made both `posts` and `profiles` tables have permissive SELECT policies to allow joins while maintaining security for INSERT/UPDATE/DELETE operations.
2. **Added Fallback Queries:** Updated components to handle RLS failures gracefully.
3. **Fixed Build Environment:** Killed processes, removed corrupted cache and node_modules, reinstalled dependencies cleanly.

**Files Modified:**
- `sql-scripts/fix-posts-profiles-join.sql`
- `app/community/[communityId]/page.jsx`
- `app/community/[communityId]/post/[postId]/page.jsx`

---

### User Display Names Fix
**Date:** December 2024  
**Related Files:** `sql-scripts/fix-user-display-names.sql`

**Problem:**  
User names showing incorrectly:
- "Unknown User" in group members
- "Anonymous" in community posts
- Email addresses in comments

Instead of proper nickname from profiles table.

**Root Causes:**  
1. Components were using stored `user_name` fields instead of fetching fresh profile data
2. Database queries weren't joining with profiles table to get current nickname
3. Comment/post creation was using old metadata instead of profile nickname
4. Existing data had outdated display names

**Solution:**  
1. **Database Migration:**
   - Added `nickname` field to profiles table
   - Updated existing comments/posts with proper display names from profiles
   - Created trigger to automatically update display names when profiles change
   - Set fallback logic: `nickname` → `full_name` → `Anonymous`

2. **Updated Database Queries:**
   - Added joins with `profiles` table to get `nickname`, `full_name`, `avatar_url`
   - Updated comment creation to fetch current nickname from profiles
   - Updated post loading to include profile data

3. **Updated Components:**
   - Updated display logic to use: `profiles?.nickname || profiles?.full_name || user_name || 'Anonymous'`
   - Updated avatar initials to use proper name
   - Maintained fallback to stored `user_name` for backward compatibility

**Files Modified:**
- `sql-scripts/fix-user-display-names.sql`
- `app/components/GroupMembersModal.jsx`
- `app/components/MembersList.jsx`
- `app/components/ConversationView.jsx`
- `app/components/CommentThread.jsx`
- `app/components/PostCard.jsx`
- `app/community/[communityId]/page.jsx`
- `app/community/[communityId]/post/[postId]/page.jsx`

---

### Next.js Build Issues Fix
**Date:** December 2024

**Problem:**  
- Next.js build cache corruption with missing build manifests
- Module resolution problems
- Turbopack configuration issues with workspace root detection
- Multiple lockfiles causing conflicts
- Port conflicts

**Solution:**  
- Killed all running Next.js processes
- Removed corrupted `.next` build cache
- Removed `node_modules` and `package-lock.json`
- Simplified `next.config.js` to remove invalid Turbopack configuration
- Reinstalled dependencies cleanly

**Files Modified:**
- `next.config.js`

---

## Architectural Decisions

### Group Members Feature
The Group Members feature allows users to view and manage members in group conversations.

**Key Components:**
- `GroupMembersModal.jsx`: Main modal component for managing group members
- `ConversationView.jsx`: Includes group members button

**Database Tables:**
- `conversations`: Stores group conversation details
- `conversation_participants`: Stores group membership
- `profiles`: Stores user profile information

**Permissions:**
- View Members: All group members can view the member list
- Add/Remove Members: Only the group creator (admin) can add or remove members
- Self-Protection: Users cannot remove themselves or the group creator

For detailed feature documentation, see `GROUP_MEMBERS_FEATURE.md`.

---

## Notes

- All RLS policies have been simplified to avoid recursive dependencies
- Application-level security now handles access control for sensitive operations
- Database triggers automatically update display names when profiles change
- Fallback queries are implemented throughout to handle RLS edge cases gracefully

---

*This changelog consolidates historical fix documentation. For current project status, see `FRESH_START_PLAN.md`.*

