# Gym Schema Fix - Migration Guide

## Problem
The `gyms` table is missing required columns (`facilities`, `opening_hours`, etc.) which causes errors when creating or updating gyms.

## Solution

### Step 1: Run the Migration Script

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `add-missing-gym-columns.sql`
4. Click "Run" to execute the migration

This will add all missing columns to the `gyms` table:
- `facilities` (JSONB) - Array of facility features
- `opening_hours` (JSONB) - Opening hours per day
- `price_range` (TEXT)
- `difficulty_levels` (TEXT[])
- `image_url` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Step 2: Refresh Schema Cache (if needed)

If you still see schema cache errors after running the migration:

1. In Supabase Dashboard, go to Settings > API
2. Click "Refresh" or wait a few minutes for the cache to update
3. Alternatively, you can restart your development server

### Step 3: Verify

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gyms'
ORDER BY ordinal_position;
```

You should see all the columns listed above.

## Files Updated

- `sql-scripts/add-missing-gym-columns.sql` - Migration script
- `app/admin/page.jsx` - Updated to include facilities when approving gym requests
- `app/gyms/request/page.jsx` - Updated to handle facilities properly
- `app/gyms/[gymId]/page.jsx` - Improved error handling for missing columns

## Image Upload

Image upload functionality has been added to the gym edit modal. Images are uploaded to the `post-media` storage bucket in Supabase Storage.

