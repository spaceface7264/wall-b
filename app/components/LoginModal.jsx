import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, title = "Sign In", subtitle = "Sign in to continue", redirectTo = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

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
        const user = result.data?.user || (await supabase.auth.getUser()).data?.user;
        
        if (!user) {
          setError('Authentication succeeded but could not get user. Please try again.');
          setIsLoading(false);
          return;
        }

        // Check if user is banned
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          setError('Your account has been banned. Please contact support if you believe this is an error.');
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Close the overlay before navigating
        onClose();

        // Redirect to the specified page or onboarding
        if (profileError || !profile || !profile.nickname || !profile.handle) {
          navigate('/onboarding');
        } else if (!profile.user_intent || profile.user_intent.length === 0) {
          navigate('/onboarding');
        } else {
          // Redirect to the specified page or home
          if (redirectTo) {
            navigate(redirectTo);
          } else {
            navigate('/home');
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        setIsLoading(false);
        setTimeout(() => navigate('/onboarding'), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed. Please check your credentials and try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 z-10 animate-slide-up" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)', backdropFilter: 'blur(20px)' }}>
        {/* Header */}
        <div className="text-center px-6 pt-8 pb-6 border-b border-gray-700/50">
          {/* Logo */}
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
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm flex-1 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
              {isSignUp ? 'Welcome, new friend 👋' : 'Welcome back, friend 👋'}
            </p>
          <button
            onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 hover:scale-110"
              aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
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
          </form>
        </div>
      </div>
    </div>
  );
}


