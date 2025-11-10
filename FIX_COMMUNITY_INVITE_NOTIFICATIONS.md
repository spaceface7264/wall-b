# Fix: Community Invite Notifications Not Working

## Problem
When inviting users to communities, notifications are not being created or displayed. This is because the database constraint on the `notifications` table doesn't include `community_invite` as an allowed notification type.

## Solution

Run the SQL script in your Supabase SQL Editor to add `community_invite` to the allowed notification types.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the SQL Script**
   - Copy and paste the contents of `sql-scripts/add-community-invite-notification-type.sql`
   - Click **Run** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

3. **Verify It Worked**
   - The script will drop the old constraint and add a new one that includes `community_invite`
   - You should see a success message

### SQL Script Location:
`proj/sql-scripts/add-community-invite-notification-type.sql`

### What the Script Does:
- Drops the existing `notifications_type_check` constraint
- Adds a new constraint that includes `community_invite` in the allowed types

### After Running:
- Users will be able to receive community invitation notifications
- Invitations will appear in the notification bell
- Users can accept/decline invitations from notifications

## Alternative: Run Complete Setup

If you haven't set up community join requests yet, you can run the complete setup script which includes this fix:

`sql-scripts/setup-community-join-requests-complete.sql`

This script includes:
- Community join requests table
- All notification types including `community_invite`
- RLS policies
- Triggers and functions

## Troubleshooting

### If you get a constraint error:
The script uses `DROP CONSTRAINT IF EXISTS`, so it should work. If you still get errors, try:

```sql
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check CASCADE;
```

Then run the ADD CONSTRAINT command from the script again.

### If notifications still don't appear:
1. Check browser console for errors
2. Verify the notification was created in the database:
   ```sql
   SELECT * FROM notifications WHERE type = 'community_invite' ORDER BY created_at DESC LIMIT 5;
   ```
3. Check RLS policies allow reading notifications:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

