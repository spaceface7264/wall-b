# Fix Database 500 Errors

## Issues Found

1. **500 errors on `community_members` table** - The trigger function `update_community_member_count()` is failing because it runs with user permissions and RLS blocks the update.

2. **400 errors on `notifications` table** - Invalid PostgREST query syntax trying to join via JSONB field.

## Solutions

### 1. Fix Community Members Trigger (500 Error)

**Run this SQL script in your Supabase SQL Editor:**

The file `sql-scripts/fix-community-members-trigger.sql` has been created. Run it to:
- Make the trigger function `SECURITY DEFINER` so it runs with elevated privileges
- Fix the trigger to handle edge cases
- Recalculate all member counts

**To apply:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `proj/sql-scripts/fix-community-members-trigger.sql`
3. Run the script

### 2. Fix Notifications Query (400 Error)

**Already fixed in code:** The notifications query has been updated to remove the invalid PostgREST join syntax. The code already enriches notifications with event data in the application layer, so this should resolve the 400 errors.

### 3. Other Issues

- **404 on `favorite_gyms` table** - This table might not exist. Check if it's needed or create it.
- **React Router warnings** - These are just warnings about future flags, not critical.
- **Missing key prop warning** - Check `SidebarLayout.jsx` for lists without keys.

## After Running the Fix

1. Refresh your browser
2. Check the console - the 500 errors on `community_members` should be gone
3. The 400 errors on `notifications` should also be resolved

## Verification

After running the SQL script, you can verify the trigger is working:

```sql
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'community_members';

-- Test by joining a community and checking if member_count updates
```

