# Quick Start Guide

## 🚀 Getting Started in 2 Minutes

### Step 1: Install & Configure (One-time setup)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Start Local Development

```bash
npm run dev
```

✅ Your app is now running at **http://localhost:3000**

The browser will open automatically, and changes will hot-reload instantly!

---

## 🌐 Testing Locally

| Command | Purpose | URL |
|---------|---------|-----|
| `npm run dev` | Development server with hot reload | http://localhost:3000 |
| `npm run dev:host` | Access from other devices on network | http://[your-ip]:3000 |
| `npm run build` | Build production bundle | Creates `dist/` folder |
| `npm run preview` | Test production build locally | http://localhost:4173 |

---

## 📤 Deploy to Netlify

### First Time Setup

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider
   - Select your repository

3. **Add Environment Variables:**
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Use the same values from your `.env` file

4. **Deploy!**
   - Netlify will auto-deploy on every git push
   - Your site will be live at `https://your-site.netlify.app`

### After Setup

Just push to your main branch, and Netlify auto-deploys! 🎉

---

## 🔍 Troubleshooting

**Port 3000 already in use?**
- Vite will try the next available port automatically
- Or change it in `vite.config.js`

**Environment variables not working?**
- Make sure `.env` file exists in project root
- Variables must start with `VITE_`
- Restart dev server after adding new variables

**Netlify build fails?**
- Check build logs in Netlify dashboard
- Verify all environment variables are set
- Ensure Node version is 18.x

---

## 📚 Need More Help?

See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for detailed instructions.

