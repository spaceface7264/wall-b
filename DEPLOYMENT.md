# 🚀 Deployment Guide

## Environment Variables Strategy

### 📋 Required Environment Variables

#### **Core Supabase Variables**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### **App Configuration**
```
NEXT_PUBLIC_APP_NAME=Wall-B
NEXT_PUBLIC_APP_DESCRIPTION=A modern bouldering community app
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
```

#### **Feature Flags (Optional)**
```
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_COMMUNITIES=true
NEXT_PUBLIC_ENABLE_GYMS=true
NEXT_PUBLIC_ENABLE_EVENTS=true
```

#### **Analytics (Optional)**
```
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_id
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

## 🌐 Deployment Platforms

### **Netlify (Recommended)**

1. **Go to [netlify.com](https://netlify.com)**
2. **Connect GitHub repository**
3. **Select branch**: `deploy`
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`
5. **Add environment variables** in Site Settings → Environment Variables
6. **Deploy!**

### **Vercel (When Available)**

1. **Go to [vercel.com](https://vercel.com)**
2. **Import GitHub repository**
3. **Select branch**: `deploy`
4. **Add environment variables** in Project Settings
5. **Deploy!**

### **Railway**

1. **Go to [railway.app](https://railway.app)**
2. **Connect GitHub repository**
3. **Add environment variables**
4. **Deploy!**

## 🔧 Local Development

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update with your values**:
   ```bash
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 📊 Environment Variable Benefits

### **✅ What This Setup Gives You:**

1. **Centralized Configuration**: All settings in one place
2. **Environment-Specific Values**: Different settings for dev/prod
3. **Feature Flags**: Enable/disable features without code changes
4. **Security**: Sensitive keys not in code
5. **Flexibility**: Easy to change settings without redeployment
6. **Validation**: Automatic validation of required variables

### **🎯 Usage in Code:**

```javascript
import config from '@/lib/config';

// Use configuration
const supabaseUrl = config.supabase.url;
const isChatEnabled = config.features.chat;
const appName = config.app.name;
```

## 🔒 Security Best Practices

1. **Never commit** `.env.local` or `.env.production`
2. **Use different keys** for development and production
3. **Rotate keys** regularly
4. **Use least privilege** for service role keys
5. **Monitor usage** of API keys

## 🚨 Troubleshooting

### **Build Fails**
- Check all required environment variables are set
- Verify Supabase credentials are correct
- Check Node.js version compatibility

### **Runtime Errors**
- Verify `NEXT_PUBLIC_` variables are accessible in browser
- Check Supabase RLS policies
- Verify database connections

### **Feature Not Working**
- Check feature flags are enabled
- Verify environment-specific configurations
- Check console for configuration errors

