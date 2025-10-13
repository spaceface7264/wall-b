# 🚨 White Screen Troubleshooting Guide

## The Problem
Your app is stuck on a white screen because it's trying to connect to Supabase but can't find the required environment variables.

## 🔍 Root Cause
The app is using placeholder values:
```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);
```

## ✅ Solution Steps

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `wall-b-community`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

### Step 2: Get Your Supabase Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Create Environment File
Create a file called `.env.local` in your project root (`/Users/rami/Desktop/html/Proj/proj/.env.local`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace the values with your actual Supabase credentials!**

### Step 4: Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `lib/enhanced-community-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

### Step 5: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd /Users/rami/Desktop/html/Proj/proj
npm run dev
```

## 🔧 Alternative: Quick Test Without Supabase

If you want to test the app without Supabase first, you can temporarily modify the main page:

### Option 1: Skip Authentication
Replace the content of `app/page.tsx` with:
```javascript
'use client'
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  // Skip auth and go directly to dashboard
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
```

### Option 2: Add Error Handling
Update `app/page.tsx` to handle connection errors:
```javascript
// Add this after line 10
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

// Add error state
const [error, setError] = useState<string | null>(null);

// Update the getUser function
const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Supabase connection error:', error);
      setError('Failed to connect to database. Please check your configuration.');
    }
    if (mounted) {
      setUser(user);
      setLoading(false);
    }
  } catch (error) {
    console.error('Error getting user:', error);
    if (mounted) {
      setError('Connection failed. Please check your internet connection.');
      setLoading(false);
    }
  }
};

// Add error display in the render
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Configuration Error</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <div className="text-sm text-gray-500">
          <p>Please check your Supabase configuration:</p>
          <ul className="text-left mt-2 space-y-1">
            <li>• Create .env.local file</li>
            <li>• Add NEXT_PUBLIC_SUPABASE_URL</li>
            <li>• Add NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>• Restart the development server</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

## 🐛 Common Issues

### Issue 1: Environment Variables Not Loading
**Symptoms**: Still seeing placeholder values in console
**Solution**: 
- Make sure `.env.local` is in the correct location (`/Users/rami/Desktop/html/Proj/proj/.env.local`)
- Restart the development server completely
- Check for typos in variable names

### Issue 2: Supabase Connection Refused
**Symptoms**: Network errors in console
**Solution**:
- Verify your Supabase URL is correct
- Check if your project is still initializing (wait 5-10 minutes)
- Ensure your internet connection is working

### Issue 3: Database Schema Errors
**Symptoms**: SQL errors when running schema
**Solution**:
- Run the migration script first: `lib/migration-fix-columns.sql`
- Then run the main schema: `lib/enhanced-community-schema.sql`
- Check Supabase logs for specific error messages

### Issue 4: Authentication Not Working
**Symptoms**: Can't login or create accounts
**Solution**:
- Enable authentication in Supabase dashboard
- Go to **Authentication** → **Settings**
- Enable email/password authentication
- Configure your site URL

## 🚀 Quick Start Commands

```bash
# 1. Navigate to project
cd /Users/rami/Desktop/html/Proj/proj

# 2. Install dependencies (if not done)
npm install

# 3. Create environment file
echo "NEXT_PUBLIC_SUPABASE_URL=your_url_here" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here" >> .env.local

# 4. Start development server
npm run dev
```

## 📋 Checklist

- [ ] Created Supabase project
- [ ] Copied Project URL and Anon Key
- [ ] Created `.env.local` file with correct values
- [ ] Ran database schema in Supabase SQL Editor
- [ ] Restarted development server
- [ ] App loads without white screen
- [ ] Can access dashboard or login page

## 🆘 Still Having Issues?

1. **Check the browser console** for error messages
2. **Check the terminal** where you ran `npm run dev` for errors
3. **Verify your Supabase project** is active and not paused
4. **Test your Supabase connection** in the Supabase dashboard SQL editor

The most common issue is missing or incorrect environment variables. Make sure your `.env.local` file is in the right place and has the correct values!
