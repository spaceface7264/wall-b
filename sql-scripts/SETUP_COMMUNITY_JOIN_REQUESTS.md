# Community Join Requests Setup Guide

## Problem
You're seeing this error:
```
Failed to send join request: Could not find the table 'public.community_join_requests' in the schema cache
```

## Solution
The `community_join_requests` table hasn't been created in your Supabase database yet.

## Quick Fix

### Option 1: Run the Complete Setup Script (Recommended)
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `setup-community-join-requests-complete.sql`
4. Click **Run** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

This script will:
- ✅ Create the `community_join_requests` table
- ✅ Set up all indexes for performance
- ✅ Configure Row Level Security (RLS) policies
- ✅ Add notification triggers
- ✅ Grant necessary permissions

### Option 2: Run Scripts Separately
If you prefer to run them separately:

1. **First**, run `create-community-join-requests-table.sql`
2. **Then**, run `add-community-join-request-notification-type.sql` (optional but recommended)

## What This Enables

After running the script, users will be able to:
- ✅ Request to join private communities
- ✅ View their own join requests
- ✅ Admins/moderators can approve/reject requests
- ✅ Receive notifications when requests are created/approved/rejected

## Verification

After running the script, you can verify it worked by running this query in the SQL Editor:

```sql
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'community_join_requests';
```

If it returns `1`, the table exists and you're good to go!

## Troubleshooting

### If you get permission errors:
Make sure you're running the script as a database admin/superuser in Supabase.

### If you get constraint errors:
The script uses `IF NOT EXISTS` and `DROP IF EXISTS` statements, so it should be safe to run multiple times. If you encounter issues, try running it again.

### If notifications don't work:
Make sure the `notifications` table exists and has the correct structure. The script will update the notification types constraint automatically.

