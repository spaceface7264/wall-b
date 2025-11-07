# Email Template Customization Guide

Simple guide to customize Supabase authentication emails (signup confirmation, password reset, etc.)

## Quick Steps

### 1. Access Email Templates
1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - **Confirm signup** - Email sent when user signs up
   - **Magic Link** - Email sent for passwordless login
   - **Change Email Address** - Email sent when changing email
   - **Reset Password** - Email sent for password reset
   - **Invite user** - Email sent when inviting users

### 2. Customize a Template

**Example: Customize "Confirm signup" email**

1. Click on **"Confirm signup"** template
2. You'll see two tabs:
   - **Subject** - Email subject line
   - **Body** - Email body (HTML)

### 3. Simple Customization

**Subject Line:**
```
Welcome to Send Train! Confirm your email
```

**Body Template (Simple):**
```html
<h2>Welcome to Send Train!</h2>
<p>Thanks for signing up! Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Happy climbing! 🧗</p>
```

### 4. Available Variables

You can use these variables in your templates:

- `{{ .ConfirmationURL }}` - Link to confirm email
- `{{ .SiteURL }}` - Your site URL (from URL Configuration)
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Confirmation token (usually not needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### 5. Recommended Simple Templates

#### Confirm Signup Email

**Subject:**
```
Confirm your Send Train account
```

**Body:**
```html
<h2>Welcome to Send Train! 🧗</h2>
<p>Hi there!</p>
<p>Thanks for joining Send Train. Click the button below to confirm your email address:</p>
<p style="margin: 20px 0;">
  <a href="{{ .ConfirmationURL }}" style="background-color: #087E8B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Confirm Email
  </a>
</p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p style="color: #666; font-size: 12px;">{{ .ConfirmationURL }}</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Happy climbing!</p>
<p style="color: #999; font-size: 12px; margin-top: 20px;">— The Send Train Team</p>
```

#### Password Reset Email

**Subject:**
```
Reset your Send Train password
```

**Body:**
```html
<h2>Reset Your Password</h2>
<p>Hi there!</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<p style="margin: 20px 0;">
  <a href="{{ .ConfirmationURL }}" style="background-color: #087E8B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
    Reset Password
  </a>
</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
<p style="color: #999; font-size: 12px; margin-top: 20px;">— The Send Train Team</p>
```

### 6. Tips

- **Keep it simple** - Don't overcomplicate the design
- **Test it** - Send yourself a test email after making changes
- **Mobile-friendly** - Keep buttons large and text readable
- **Brand colors** - Use your app's color (#087E8B for Send Train)
- **Clear call-to-action** - Make the button/link obvious

### 7. Testing

After customizing:
1. Click **"Save"** at the bottom
2. Test by signing up a new user or requesting a password reset
3. Check your email to see how it looks

### 8. Advanced (Optional)

If you want more control, you can:
- Use custom HTML/CSS
- Add your logo
- Use more complex layouts
- Add multiple languages

But for most cases, the simple templates above work great!

---

**Note:** Changes take effect immediately. No code changes needed - it's all in the Supabase dashboard!

