# Fix RLS Permission Errors

## Problem
You're getting these errors:
1. **"Permission denied. Please ensure the RLS policy allows users to leave communities"**
2. **"Permission denied. Please ensure the RLS policy allows admins to delete communities"**

## Solution

### Step 1: Fix Leave Community Policy

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `fix-leave-community-policy.sql`
4. Click **Run** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

This script will:
- ✅ Enable RLS on `community_members` table
- ✅ Create DELETE policy allowing users to leave communities
- ✅ Grant DELETE permissions to authenticated users
- ✅ Add policy for admins/moderators to remove members

### Step 2: Fix Admin Delete Community Policy

1. Still in **SQL Editor**
2. Copy and paste the contents of `fix-community-suspend-policy.sql`
3. Click **Run** or press `Ctrl+Enter`

This script will:
- ✅ Create `is_admin_user()` function (SECURITY DEFINER)
- ✅ Create DELETE policy allowing admins to delete communities
- ✅ Create UPDATE policy allowing admins to suspend/unsuspend communities
- ✅ Grant DELETE permissions to authenticated role
- ✅ Add diagnostic queries to verify admin status

### Step 3: Verify Your Admin Status

After running the scripts, verify you're an admin:

```sql
-- Check if you're an admin
SELECT 
  id,
  email,
  COALESCE(is_admin, FALSE) as is_admin
FROM profiles 
WHERE id = auth.uid();
```

If `is_admin` is `FALSE` or `NULL`, set it to `TRUE`:

```sql
-- Set yourself as admin (replace with your user ID if needed)
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = auth.uid();
```

### Step 4: Test the Policies

**Test Leave Community:**
1. Try leaving a community you're a member of
2. Should work without permission errors

**Test Admin Delete:**
1. Go to admin panel
2. Try deleting a community
3. Should work without permission errors

## Troubleshooting

### If leave community still doesn't work:

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'community_members';
   ```
   Should show `rowsecurity = true`

2. **Check if DELETE policies exist:**
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'community_members'
   AND cmd = 'DELETE';
   ```
   Should show at least one DELETE policy

3. **Verify permissions:**
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name = 'community_members'
   AND privilege_type = 'DELETE';
   ```
   Should show `authenticated` role has DELETE privilege

### If admin delete still doesn't work:

1. **Check if you're actually an admin:**
   ```sql
   SELECT public.is_admin_user() as is_admin;
   ```
   Should return `true`

2. **Check if DELETE policy exists:**
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'communities'
   AND cmd = 'DELETE';
   ```
   Should show "Allow admins to delete communities" policy

3. **Verify function exists:**
   ```sql
   SELECT proname, prosecdef
   FROM pg_proc
   WHERE proname = 'is_admin_user';
   ```
   Should show the function with `prosecdef = true` (SECURITY DEFINER)

4. **Check your profile:**
   ```sql
   SELECT id, email, is_admin
   FROM profiles
   WHERE id = auth.uid();
   ```
   `is_admin` should be `TRUE`

## Important Notes

- Both scripts use `DROP POLICY IF EXISTS` to avoid conflicts
- The `is_admin_user()` function uses `SECURITY DEFINER` to bypass RLS on profiles table
- Make sure you're logged in as the correct user when running these scripts
- After running scripts, refresh your browser to clear any cached permissions

## Files Modified

- `fix-leave-community-policy.sql` - Fixed SQL syntax error in test query
- `fix-community-suspend-policy.sql` - Added GRANT DELETE and improved policy coverage

