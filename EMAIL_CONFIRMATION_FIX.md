# Email Confirmation Fix Guide

## Problem
When users click the email confirmation link, they get an error: **"requested path is invalid"**

This happens because the redirect URL needs to be configured in your Supabase project settings.

## Solution

### Step 1: Configure Supabase Auth Settings

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Configure the following:

#### Site URL
Set this to your production domain (or localhost for development):
- **Production**: `https://yourdomain.com`
- **Development**: `http://localhost:5173` (or your Vite dev server port)

#### Redirect URLs
Add all the URLs where users should be redirected after email confirmation:

**For Development:**
```
http://localhost:5173/login
http://localhost:5173/*
```

**For Production:**
```
https://yourdomain.com/login
https://yourdomain.com/*
```

**Important:** The redirect URL must match exactly what you're using in your code. Currently, the code uses:
```javascript
emailRedirectTo: `${window.location.origin}/login`
```

So if your site is at `https://yourdomain.com`, the redirect URL should be `https://yourdomain.com/login`.

### Step 2: Verify Email Template Settings

1. Go to **Authentication** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Make sure the template uses `{{ .ConfirmationURL }}` in the email body
4. The confirmation URL will automatically include your configured redirect URL

### Step 3: Test the Flow

1. Sign up with a new email address
2. Check your email for the confirmation link
3. Click the confirmation link
4. You should be redirected to `/login` and see a success message
5. The app should automatically log you in and redirect to onboarding or home

## Troubleshooting

### Still Getting "requested path is invalid"?

1. **Check the exact URL in the email**: The confirmation link should look like:
   ```
   https://yourproject.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https://yourdomain.com/login
   ```

2. **Verify redirect URL matches**: The `redirect_to` parameter must exactly match one of your configured Redirect URLs in Supabase

3. **Check for trailing slashes**: Make sure your redirect URLs don't have mismatched trailing slashes
   - ✅ `https://yourdomain.com/login`
   - ❌ `https://yourdomain.com/login/` (if not configured)

4. **Clear browser cache**: Sometimes cached redirects can cause issues

5. **Check Supabase logs**: Go to **Logs** → **Auth Logs** in Supabase dashboard to see detailed error messages

### Common Issues

**Issue:** Redirect URL works locally but not in production
- **Solution:** Make sure you've added your production domain to Redirect URLs, not just localhost

**Issue:** Users are redirected but not logged in
- **Solution:** The code now handles this automatically. Check browser console for any errors.

**Issue:** Email confirmation link expires
- **Solution:** Default expiration is 24 hours. Users can request a new confirmation email by trying to sign in again.

## Code Changes Made

The `LoginPage.jsx` component has been updated to:
1. ✅ Detect email confirmation callbacks from URL hash/query params
2. ✅ Automatically handle the session when user returns from email
3. ✅ Show success message and redirect appropriately
4. ✅ Handle errors gracefully

## Additional Notes

- The redirect URL is set dynamically using `window.location.origin`, so it works for both development and production
- Make sure to add both your development and production URLs to Supabase Redirect URLs
- Wildcard patterns (`/*`) are supported for sub-paths

