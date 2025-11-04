# 🚀 Deployment Quick Reference

A one-page cheat sheet for daily deployment workflow.

---

## 🔄 Daily Workflow

### 1. Make Changes
```bash
npm run dev              # Start developing
```

### 2. Before Committing
```bash
npm run check:build      # Lint + build (catches errors)
npm run preview          # Test production build on localhost:4173
```

### 3. Deploy
```bash
git add .
git commit -m "Your message"
git push                  # Auto-deploys to Netlify
```

---

## 🧪 Testing Commands

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npm run dev` | Development server | Daily coding |
| `npm run build` | Build for production | Before deploying |
| `npm run preview` | Test production build | Before deploying |
| `npm run check:build` | Lint + build | Pre-deployment check |
| `npm run test:production` | Full production test | Before important deploys |
| `npm run lint` | Check code quality | Before committing |

---

## ✅ Pre-Deployment Checklist

Run this before every deploy:

```bash
# 1. Check code quality
npm run lint

# 2. Build and test
npm run check:build
npm run preview

# 3. Manual checks on localhost:4173:
#    - No console errors
#    - All routes work
#    - Login works
#    - Mobile responsive

# 4. Then deploy
git push
```

---

## 🚨 Quick Troubleshooting

### Build fails?
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Environment variables not working?
1. Check Netlify dashboard → Environment variables
2. Variables must start with `VITE_`
3. Redeploy after adding variables

### Site works locally but not deployed?
```bash
# Test production build locally
NODE_ENV=production npm run build
npm run preview
```

---

## 📍 Important URLs

- **Local Dev:** http://localhost:3000
- **Production Preview:** http://localhost:4173
- **Netlify Dashboard:** https://app.netlify.com
- **Your Site:** https://your-site.netlify.app

---

## 🎯 Common Scenarios

### Quick UI Fix
```bash
npm run dev              # Make change
npm run check:build      # Verify
git push                 # Deploy
```

### New Feature
```bash
git checkout -b feature/new-feature
npm run dev              # Develop
npm run test:production  # Test thoroughly
git push                 # Creates preview deploy
# Test preview → Merge PR
```

### Emergency Fix
```bash
# Fix on main branch
npm run check:build
npm run preview
git push                 # Deploys immediately
```

---

## 📊 Build Status

- ✅ **Green** = Deployed successfully
- ❌ **Red** = Build failed (check logs)
- 🟡 **Yellow** = Building...

---

## 💡 Pro Tips

1. Always `npm run preview` before deploying
2. Use PR preview deploys for testing
3. Monitor Netlify build logs
4. Keep `netlify.toml` updated
5. Test on mobile after deploying

---

**Full Guide:** See `DEPLOYMENT_TESTING_GUIDE.md`


