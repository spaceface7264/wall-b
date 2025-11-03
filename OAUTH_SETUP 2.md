# OAuth Setup Guide

This guide walks you through setting up Google and Apple OAuth authentication in your Supabase project.

## Prerequisites

- Supabase project with Auth enabled
- Google Cloud Console account (for Google OAuth)
- Apple Developer account (for Apple OAuth) - Optional but recommended

## Google OAuth Setup

### Step 1: Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "Rocha" (or your app name)
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Rocha Web Client" (or your preferred name)
   - Authorized JavaScript origins:
     - `https://your-project-ref.supabase.co`
     - `http://localhost:3000` (for local development)
   - Authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/v1/callback` (for local development)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Click **Enable Google**
5. Enter your **Client ID** and **Client Secret** from Step 1
6. Click **Save**

### Step 3: Update Redirect URLs (if needed)

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your site URL: `https://your-domain.com` (or `http://localhost:3000` for local)
3. Add redirect URLs:
   - `https://your-domain.com/login`
   - `http://localhost:3000/login` (for local development)

## Apple OAuth Setup

### Step 1: Create App ID and Service ID in Apple Developer

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create an **App ID**:
   - Description: "Rocha App"
   - Bundle ID: `com.yourcompany.rocha` (use reverse domain notation)
   - Enable **Sign In with Apple** capability
   - Register the App ID
4. Create a **Service ID**:
   - Description: "Rocha Web Service"
   - Identifier: `com.yourcompany.rocha.web` (use reverse domain notation)
   - Enable **Sign In with Apple**
   - Configure domains:
     - Domain: `your-project-ref.supabase.co`
     - Return URLs:
       - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Save the configuration
5. Create a **Key**:
   - Key name: "Rocha Sign In with Apple Key"
   - Enable **Sign In with Apple**
   - Download the key file (`.p8` file - you can only download it once!)
   - Note the **Key ID**

### Step 2: Configure Apple OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Apple** in the list
4. Click **Enable Apple**
5. Enter the following:
   - **Services ID**: The Service ID from Step 1 (e.g., `com.yourcompany.rocha.web`)
   - **Secret Key**: The contents of the `.p8` key file from Step 1
   - **Key ID**: The Key ID from Step 1
   - **Team ID**: Your Apple Developer Team ID (found in Apple Developer Portal)
6. Click **Save**

### Step 3: Update Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Ensure your site URL and redirect URLs are configured (same as Google setup)

## Testing OAuth

### Local Development

1. Make sure your local development server is running
2. Add `http://localhost:3000` to your OAuth provider's authorized redirect URIs
3. Test the OAuth flow:
   - Click "Continue with Google" or "Continue with Apple"
   - Complete the OAuth consent
   - You should be redirected back to `/login`
   - If profile is incomplete, you'll be redirected to `/onboarding`

### Production

1. Replace all `localhost` URLs with your production domain
2. Update OAuth provider settings with production URLs
3. Update Supabase URL Configuration with production URLs
4. Test the full OAuth flow

## Troubleshooting

### Common Issues

**Issue: "redirect_uri_mismatch" error**
- **Solution**: Ensure your redirect URI in OAuth provider settings exactly matches: `https://your-project-ref.supabase.co/auth/v1/callback`

**Issue: "invalid_client" error**
- **Solution**: Double-check your Client ID and Client Secret in Supabase dashboard

**Issue: Apple Sign In not working**
- **Solution**: 
  - Verify your Key ID, Team ID, and Service ID are correct
  - Ensure the `.p8` key file content is pasted correctly (including the header/footer)
  - Check that the Service ID has the correct domain and return URLs configured

**Issue: User redirected but no session created**
- **Solution**: 
  - Check browser console for errors
  - Verify the redirect URL in Supabase matches your app's URL
  - Check that `detectSessionInUrl: true` is set in your Supabase client config

### Environment Variables

No additional environment variables are needed for OAuth - Supabase handles the OAuth configuration server-side.

## Security Notes

- Never expose your OAuth Client Secrets or Apple Key files in client-side code
- Always use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in your Supabase dashboard for suspicious activity

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
