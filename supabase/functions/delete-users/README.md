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
   supabase secrets set SERVICE_ROLE_KEY=your-service-role-key
   ```

   **Important:** Use `SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`) because Supabase CLI doesn't allow secret names starting with `SUPABASE_`.

   You can find your service role key in your Supabase project settings under API.

5. **Deploy the function**:
   ```bash
   supabase functions deploy delete-users
   ```

## Environment Variables

The function requires these environment variables:
- `SUPABASE_URL` - Your Supabase project URL (automatically provided by Supabase Edge Functions)
- `SERVICE_ROLE_KEY` - Your Supabase service role key (set via `supabase secrets set SERVICE_ROLE_KEY=your-key`)

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
- Verify your service role key is set correctly: `supabase secrets list`
- Check that the requesting user has `is_admin: true` in their profile

If you get "Env name cannot start with SUPABASE_":
- Use `SERVICE_ROLE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- Supabase CLI blocks secrets starting with `SUPABASE_` for security reasons

