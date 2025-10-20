import { createClient } from '@supabase/supabase-js';

// Global flag to prevent multiple client initializations
let supabaseClient = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only validate in browser environment, not during build
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please create a .env.local file with:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  }
}

// Create client only once
if (!supabaseClient) {
  console.log('🔧 Creating Supabase client...');
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
  console.log('✅ Supabase client created');
} else {
  console.log('♻️ Reusing existing Supabase client');
}

export const supabase = supabaseClient;


