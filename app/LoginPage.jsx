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
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#252526',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '14px', color: '#8B8B8B' }}>
            Welcome to Wall-B
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          marginBottom: '32px',
          background: '#1A1A1A',
          padding: '4px',
          borderRadius: '12px'
        }}>
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: !isSignUp ? '#FFFFFF' : 'transparent',
              color: !isSignUp ? '#0A0A0A' : '#8B8B8B'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isSignUp ? '#FFFFFF' : 'transparent',
              color: isSignUp ? '#0A0A0A' : '#8B8B8B'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              background: '#CCC',
              border: '1px solid #999',
              borderRadius: '8px',
              color: '#000',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#666'}
            onBlur={(e) => e.target.style.borderColor = '#999'}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              background: '#CCC',
              border: '1px solid #999',
              borderRadius: '8px',
              color: '#000',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#666'}
            onBlur={(e) => e.target.style.borderColor = '#999'}
          />

          {error && (
            <p style={{ 
              fontSize: '13px', 
              color: '#FF6B6B',
              margin: '0'
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#FFFFFF',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? '0.6' : '1',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.background = '#F0F0F0')}
            onMouseLeave={(e) => !isLoading && (e.target.style.background = '#FFFFFF')}
          >
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>

        {/* Footer hint */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#5A5A5A',
          marginTop: '24px',
          lineHeight: '1.5',
          minHeight: '36px',
          visibility: isSignUp ? 'visible' : 'hidden'
        }}>
          By signing up, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}