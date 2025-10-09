'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if Supabase is properly configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setError('Please configure your Supabase credentials in .env.local');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-app mobile-safe-area flex items-center justify-center p-4" style={{ backgroundColor: '#181C21' }}>
      <div className="w-full max-w-sm">
        <div className="minimal-card p-4">
          <h2 className="text-center minimal-heading mb-4">
            Sign in
          </h2>
          {process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded-sm">
              <p className="minimal-text text-yellow-300 text-center">
                ⚠️ Supabase not configured. Add your credentials to .env.local
              </p>
            </div>
          )}
          <form className="space-y-3" onSubmit={handleLogin}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="minimal-input w-full"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="minimal-input w-full"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="minimal-text text-red-400 text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="minimal-button w-full bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}