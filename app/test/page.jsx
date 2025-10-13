'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function TestPage() {
  const [status, setStatus] = useState('Loading...');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing Supabase connection...');
        
        // Test basic connection
        const { data, error: dbError } = await supabase
          .from('communities')
          .select('count')
          .limit(1);
        
        if (dbError) {
          setError(`Database error: ${dbError.message}`);
          setStatus('Database connection failed');
          return;
        }
        
        setStatus('Database connected! Testing auth...');
        
        // Test auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setError(`Auth error: ${authError.message}`);
        } else {
          setUser(user);
          setStatus('Auth working!');
        }
        
      } catch (err) {
        setError(`Connection failed: ${err.message}`);
        setStatus('Connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Environment Variables:</strong>
          <ul className="ml-4 mt-2">
            <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
            <li>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>
        
        {user && (
          <div>
            <strong>User:</strong> {user.email || 'No email'}
          </div>
        )}
        
        {error && (
          <div className="text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="mt-8">
          <a href="/" className="text-blue-400 hover:underline">
            ← Back to main app
          </a>
        </div>
      </div>
    </div>
  );
}
