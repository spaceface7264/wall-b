import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    setResetMessage('');
    if (!email) {
      setResetMessage('Enter your email above, then click Forgot password.');
      return;
    }
    try {
      setIsSendingReset(true);
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        setResetMessage(resetError.message || 'Failed to send reset email');
        return;
      }
      setResetMessage('Password reset email sent. Check your inbox.');
    } catch (e) {
      setResetMessage('Failed to send reset email');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp && !acceptedTerms) {
        setError('Please accept the Terms & Conditions to create an account.');
        setIsLoading(false);
        return;
      }
      const result = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      // For signup, check if email confirmation is required
      if (isSignUp && result.data && !result.data.session) {
        setError('Please check your email to confirm your account before signing in.');
        setIsLoading(false);
        return;
      }

      // If we have a session, check profile completeness
      try {
        // Use the user from the result if available, otherwise fetch
        const user = result.data?.user || (await supabase.auth.getUser()).data?.user;
        
        if (!user) {
          // For email confirmation flows, send to login
          setError('Authentication succeeded but could not get user. Please try again.');
          setIsLoading(false);
          return;
        }

        // Try to fetch profile - use maybeSingle() to avoid errors if profile doesn't exist
        console.log('🔍 Fetching profile for user:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('📋 Profile query result:', { profile, profileError });
        
        // If profile query fails, log the error but continue to onboarding
        if (profileError) {
          console.warn('⚠️ Profile query error (continuing to onboarding):', profileError);
        }

        // Check if user is banned
        if (profile && profile.is_banned) {
          // Sign out the user immediately
          await supabase.auth.signOut();
          setError('Your account has been banned. Please contact support if you believe this is an error.');
          setIsLoading(false);
          return;
        }

        // Add a small delay to ensure navigation happens smoothly
        setIsLoading(false);
        
        // Wait a moment before navigating to let loading state clear
        await new Promise(resolve => setTimeout(resolve, 100));

        // If profile doesn't exist or missing required fields, go to onboarding
        if (profileError || !profile || !profile.nickname || !profile.handle) {
          navigate('/onboarding');
        } else if (!profile.user_intent || profile.user_intent.length === 0) {
          // If user_intent is missing, redirect to onboarding to complete it
          navigate('/onboarding');
        } else {
          // User has completed onboarding, go to home
          navigate('/home');
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        setIsLoading(false);
        // On error, assume onboarding needed
        setTimeout(() => navigate('/onboarding'), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed. Please check your credentials and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <StarfieldBackground />
      <div className="w-full max-w-sm relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Rocha</h1>
          <p className="mobile-text-sm font-bold mb-6 " style={{ color: 'var(--text-secondary)' }}>
            Bouldering Community
          </p>
          <p className="mobile-text-sm" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Welcome, new friend' : 'Welcome back, friend'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="mobile-card" style={{ backgroundColor: 'rgba(30, 30, 30, 0.85)', backdropFilter: 'blur(10px)' }}>
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-gray-800/40 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                !isSignUp 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                isSignUp 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="minimal-label flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="minimal-input w-full"
                required
              />
            </div>

            <div>
              <label className="minimal-label flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="minimal-input w-full pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mobile-btn-primary w-full justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            {/* Forgot password */}
            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                  className="text-blue-400 hover:text-blue-300 mobile-text-sm"
                >
                  {isSendingReset ? 'Sending…' : 'Forgot password?'}
                </button>
                {resetMessage && (
                  <span className="mobile-text-xs text-gray-400 ml-2 truncate">
                    {resetMessage}
                  </span>
                )}
              </div>
            )}

            {/* Accept Terms & Conditions for Sign Up */}
            {isSignUp && (
              <label className="flex items-center gap-2 mobile-text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="accent-blue-600"
                />
                I agree to the
                <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">Terms & Conditions</a>
              </label>
            )}
          </form>
        </div>

        {/* Footer Link */}
        {/* Footer link removed to avoid duplicate Sign Up/Sign In toggle (tab switcher covers it) */}
      </div>
    </div>
  );
}