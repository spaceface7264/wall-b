# Fix Leave Community Error

## Problem
You're seeing this error:
```
Failed to leave community
```

## Root Cause
The Row Level Security (RLS) policy that allows users to delete their own community memberships is missing or not properly configured in your Supabase database.

## Solution

### Quick Fix
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix-leave-community-policy.sql`
4. Click **Run** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

This script will:
- ✅ Enable RLS on `community_members` table (if not already enabled)
- ✅ Create the "Allow users to leave communities" DELETE policy
- ✅ Add a policy for admins/moderators to remove members
- ✅ Grant necessary permissions

## What This Enables

After running the script, users will be able to:
- ✅ Leave communities they've joined
- ✅ Delete their own membership records
- ✅ Admins/moderators can remove members from their communities

## Verification

After running the script, you can verify it worked by running this query in the SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'community_members'
AND cmd = 'DELETE';
```

You should see at least one policy with `cmd = 'DELETE'` that allows users to delete their own records.

## Troubleshooting

### If you still get permission errors:
1. Make sure you're logged in as the user trying to leave
2. Verify the user is actually a member of the community
3. Check that RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'community_members';`
4. Ensure the policy exists: Run the verification query above

### If the error persists:
The issue might be that:
- The user is not authenticated properly
- The `community_members` table structure is different than expected
- There are conflicting policies

In that case, check the browser console for the full error message and verify your database schema matches the expected structure.

