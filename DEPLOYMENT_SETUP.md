# Development & Deployment Setup Guide

This guide will help you set up both local development (localhost) and Netlify deployment environments.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account and project
- A Netlify account

---

## 🏠 Local Development Setup (localhost)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   You can find these in your Supabase dashboard:
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key

### Step 3: Start Local Development Server

```bash
npm run dev
```

This will:
- Start the Vite development server on **http://localhost:3000**
- Automatically open your browser
- Enable hot module replacement (HMR) for instant updates
- Show helpful error messages in the browser console

### Step 4: Test on Your Network (Optional)

To test on other devices on your local network (e.g., your phone):

```bash
npm run dev:host
```

This makes your dev server accessible at `http://[your-local-ip]:3000`.

---

## 🚀 Netlify Deployment Setup

### Step 1: Connect Your Repository

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Netlify will detect the build settings from `netlify.toml`

### Step 2: Configure Build Settings

Netlify should auto-detect these from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

### Step 3: Set Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:

   **Required:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   **Optional:**
   ```
   VITE_APP_NAME=Wall-B
   VITE_APP_URL=https://your-site.netlify.app
   VITE_DEBUG=false
   VITE_ENABLE_CHAT=true
   VITE_ENABLE_COMMUNITIES=true
   VITE_ENABLE_GYMS=true
   VITE_ENABLE_EVENTS=true
   ```

   **For admin features (server-side only):**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 4: Deploy

1. **Automatic Deployment**: Every push to your main/master branch will trigger a deploy
2. **Manual Deployment**: Click "Trigger deploy" in the Netlify dashboard
3. **Preview Deploys**: Pull requests automatically get preview deployments

---

## 🧪 Testing Workflow

### Local Testing (Development Mode)

```bash
# Start dev server with hot reload
npm run dev
```

- Visit: **http://localhost:3000**
- Changes reflect immediately
- Full debugging capabilities
- Access to browser dev tools

### Production Build Preview (Local)

Test the production build locally before deploying:

```bash
# Build and preview production build
npm run build
npm run preview
```

Or use the combined command:
```bash
npm run build:preview
```

- Visit: **http://localhost:4173** (Vite preview default port)
- Tests the exact build that will be deployed
- Catch production-only issues early

### Production Testing (Netlify)

1. Deploy to Netlify (automatic or manual)
2. Test on the live URL: `https://your-site.netlify.app`
3. Check Netlify build logs for errors
4. Use Netlify's deploy previews for testing PRs

---

## 📁 File Structure Reference

```
proj/
├── .env                  # Your local environment variables (NOT committed)
├── .env.example         # Template for environment variables (committed)
├── netlify.toml         # Netlify configuration
├── vite.config.js       # Vite build configuration
├── package.json         # Dependencies and scripts
└── dist/                # Production build output (generated)
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run dev:host` | Start dev server accessible on local network |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run build:preview` | Build and preview in one command |
| `npm run lint` | Check code for linting errors |
| `npm run lint:fix` | Auto-fix linting errors |

---

## 🐛 Troubleshooting

### Local Development Issues

**Port already in use:**
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.js
```

**Environment variables not loading:**
- Ensure `.env` file exists in the project root
- Restart the dev server after adding new variables
- Variables must start with `VITE_` to be exposed to the client

**Build errors locally:**
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Netlify Deployment Issues

**Build fails:**
- Check build logs in Netlify dashboard
- Verify all environment variables are set
- Ensure Node version matches (18.x)

**Environment variables not working:**
- Verify variables are set in Netlify dashboard
- Redeploy shipping a new commit (Env vars require redeploy)
- Check that variable names start with `VITE_` for client-side access

**Routing doesn't work (404 on refresh):**
- Verify `netlify.toml` redirects rule is present
- SPA redirects should be: `/* /index.html 200`

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different Supabase projects** for dev and production (recommended)
3. **Service Role Key** should only be in server-side code or Netlify environment variables (never exposed to client)
4. **Review Netlify build logs** to ensure secrets aren't logged

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Add Supabase credentials to `.env`
- [ ] Test locally: `npm run dev`
- [ ] Verify localhost:3000 works
- [ ] Test production build: `npm run build && npm run preview`
- [ ] Connect repository to Netlify
- [ ] Add environment variables in Netlify dashboard
- [ ] Deploy and verify live site works

---

## 💡 Tips

1. **Use Netlify Deploy Previews**: Test PRs before merging
2. **Monitor Netlify Analytics**: Track performance and errors
3. **Set up branch deploys**: Test feature branches in isolation
4. **Use Netlify Functions**: For server-side operations if needed
5. **Enable Netlify Forms**: If you need form submissions

