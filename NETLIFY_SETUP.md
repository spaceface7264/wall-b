# Netlify Deployment Setup Guide

## Critical Steps Required

### 1. Change Production Branch to `main`
- Go to Netlify Dashboard → Your Site
- **Site settings** → **Build & deploy** → **Continuous Deployment**
- Change **"Production branch"** from `2.0` to `main`
- Click **Save**

### 2. Set Environment Variables
- Go to **Site settings** → **Environment variables**
- Delete any `NEXT_PUBLIC_*` variables (wrong prefix)
- Add these variables:

**Required:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Optional:**
```
VITE_APP_NAME=Wall-B
VITE_APP_URL=https://your-site.netlify.app
VITE_ENABLE_CHAT=true
VITE_ENABLE_COMMUNITIES=true
VITE_ENABLE_GYMS=true
VITE_ENABLE_EVENTS=true
```

**Server-side only (if needed):**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Clear Cache and Redeploy
- Go to **Deploys** tab
- Click **"Clear cache and deploy site"**
- Or trigger a new deploy after making changes above

---

## Disable Other Platforms

### Disable GitHub Pages
1. Go to GitHub repository → **Settings** → **Pages**
2. Under **Source**, select **"None"**
3. Click **Save**

### Disable Vercel (if integrated)
1. Go to Vercel Dashboard
2. Find your project and disconnect it
3. Or remove Vercel integration from GitHub Settings → Integrations

---

## Current Configuration

- **Build command:** `npm install --production=false && npm run build`
- **Publish directory:** `dist`
- **Node version:** 20
- **Framework:** Vite + React

The `netlify.toml` file is already configured correctly. After changing the branch and setting environment variables, deployment should work automatically.


