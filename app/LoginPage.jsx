import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle email confirmation callback
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for hash fragments (Supabase uses #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      // Also check query params (some configurations use ?access_token=...)
      const queryToken = searchParams.get('access_token');
      const queryType = searchParams.get('type');

      if ((accessToken || queryToken) && (type === 'signup' || queryType === 'signup')) {
        try {
          setIsLoading(true);
          setError('');
          
          // Supabase should automatically handle the session from the URL
          // But we'll verify it worked
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Email confirmation failed. Please try signing in again.');
            setIsLoading(false);
            return;
          }

          if (session?.user) {
            setSuccessMessage('Email confirmed successfully! Redirecting...');
            
            // Clear URL hash/params
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Check profile and redirect accordingly
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.warn('Profile query error:', profileError);
            }

            // Check if user is banned
            if (profile?.is_banned) {
              await supabase.auth.signOut();
              setError('Your account has been banned. Please contact support.');
              setIsLoading(false);
              return;
            }

            // Redirect based on profile completeness
            setTimeout(() => {
              if (!profile || !profile.nickname || !profile.handle) {
                navigate('/onboarding');
              } else if (!profile.user_intent || profile.user_intent.length === 0) {
                navigate('/onboarding');
              } else {
                navigate('/home');
              }
            }, 1500);
          } else {
            setError('Email confirmation failed. Please try signing in with your credentials.');
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Email confirmation error:', err);
          setError('Email confirmation failed. Please try signing in again.');
          setIsLoading(false);
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

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
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`
            }
          })
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
        <div className="text-center mb-10 animate-fade-in">
          {!logoError ? (
            <img 
              src="/logo.png" 
              alt="Send Train" 
              className="mx-auto mb-5 transition-transform duration-300 hover:scale-105"
              style={{ 
                height: '72px', 
                width: 'auto',
                maxWidth: '220px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
              }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <h1 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>Send Train</h1>
          )}
          <p className="text-sm font-semibold mb-2 tracking-wide uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            Bouldering Community
          </p>
          <p className="text-sm font-medium mt-4" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Welcome, new friend 👋' : 'Welcome back, friend 👋'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="mobile-card animate-slide-up" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(75, 85, 99, 0.3)' }}>
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-gray-800/60 rounded-xl mb-6 border border-gray-700/30">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isSignUp 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="minimal-label flex items-center gap-2 mb-2.5 text-sm font-medium">
                <Mail className="w-4 h-4 opacity-70" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="minimal-input w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="minimal-label flex items-center gap-2 mb-2.5 text-sm font-medium">
                <Lock className="w-4 h-4 opacity-70" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="minimal-input w-full pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-all duration-200 hover:scale-110 p-1 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Accept Terms & Conditions for Sign Up */}
            {isSignUp && (
              <label className="flex items-start gap-3 mobile-text-sm text-gray-300 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="accent-blue-600 mt-0.5 w-4 h-4 cursor-pointer"
                />
                <span className="flex-1">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">Terms & Conditions</a>
                </span>
              </label>
            )}

            {error && (
              <div className="p-3.5 bg-red-900/30 border border-red-700/50 rounded-lg animate-shake">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mobile-btn-primary w-full justify-center py-3 font-semibold text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                  className="text-blue-400 hover:text-blue-300 mobile-text-sm font-medium transition-colors"
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
          </form>
        </div>

        {/* Continue without login */}
        <div className="mt-8 text-center animate-fade-in">
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 mobile-text-sm transition-all duration-200 hover:gap-3 mx-auto font-medium"
          >
            Continue without login
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}