# Delete Users Edge Function

This Edge Function allows admins to delete users from the Supabase auth system. It requires service role access to delete users from `auth.users`.

## Setup

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set environment variables**:
   The Edge Function needs access to your Supabase service role key. Set it as a secret:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   You can find your service role key in your Supabase project settings under API.

5. **Deploy the function**:
   ```bash
   supabase functions deploy delete-users
   ```

## Environment Variables

The function requires these environment variables (set via `supabase secrets`):
- `SUPABASE_URL` - Your Supabase project URL (usually auto-detected)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required)

## Usage

The function is called automatically from the admin panel when deleting users. It:
1. Verifies the requesting user is an admin
2. Deletes the specified users from `auth.users` (which cascades to profiles)
3. Returns success/failure status for each user

## Security

- Only authenticated admin users can call this function
- The function uses service role access server-side only
- User authentication is verified before any deletions

## Troubleshooting

If you get "Edge Function Not Found" error:
- Make sure the function is deployed: `supabase functions deploy delete-users`
- Verify the function name matches: `delete-users`
- Check that your Supabase URL is correct in your environment variables

If you get permission errors:
- Verify your service role key is set correctly
- Check that the requesting user has `is_admin: true` in their profile

