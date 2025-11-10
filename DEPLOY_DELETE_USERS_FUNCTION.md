# Deploy Delete Users Edge Function

This guide will help you deploy the `delete-users` Edge Function to Supabase.

## Quick Deployment Steps

### 1. Login to Supabase CLI
```bash
cd /Users/rami/Desktop/html/Proj/proj
supabase login
```
This will open your browser to authenticate. Follow the prompts.

### 2. Link Your Project
```bash
supabase link --project-ref xnxdxuoecnulcoapawtu
```

### 3. Set Service Role Key Secret
You need to get your service role key from the Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/xnxdxuoecnulcoapawtu/settings/api
- Copy the **service_role** key (keep it secret!)
- Run:
```bash
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** We use `SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`) because Supabase CLI doesn't allow secret names starting with `SUPABASE_`.

### 4. Deploy the Function
```bash
supabase functions deploy delete-users
```

## Verify Deployment

After deployment, you should see a success message. The function will be available at:
`https://xnxdxuoecnulcoapawtu.supabase.co/functions/v1/delete-users`

## Troubleshooting

### "Access token not provided"
- Run `supabase login` first

### "Project not found"
- Verify the project reference is correct: `xnxdxuoecnulcoapawtu`
- Check that you have access to this project in your Supabase account

### "Function deployment failed"
- Make sure you've set the service role key secret: `supabase secrets set SERVICE_ROLE_KEY=your-key`
- Check that you're in the correct directory (`proj/`)
- Verify the function code is correct: `supabase/functions/delete-users/index.ts`

### "Env name cannot start with SUPABASE_"
- Use `SERVICE_ROLE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- Supabase CLI blocks secrets starting with `SUPABASE_` for security reasons

### "Function Not Found" error in the app
- Verify the function name matches exactly: `delete-users`
- Check that deployment completed successfully
- Wait a few seconds after deployment for the function to propagate

## What This Function Does

The `delete-users` Edge Function:
- Allows admins to permanently delete users from the auth system
- Verifies the requesting user is an admin before allowing deletion
- Uses service role access to delete users from `auth.users`
- Returns success/failure status for each user deletion

## Security Notes

- Only authenticated admin users can call this function
- The service role key is stored as a secret and never exposed to clients
- User authentication is verified before any deletions occur

