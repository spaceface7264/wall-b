import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // When coming from the recovery link, Supabase sets a session via the URL hash.
    // We just need to confirm there's a session before allowing password update.
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError('Failed to verify session. Please open the reset link again.');
        return;
      }
      setHasSession(!!data?.session);
    };
    checkSession();
  }, [location]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!hasSession) {
      setError('Recovery session not found. Click the email link again.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsUpdating(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        return;
      }
      setMessage('Password updated successfully. You can now sign in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setError('Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #1a1a1b 0%, #252526 100%)'
    }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="mobile-text-sm text-gray-400">
            Set a new password for your account
          </p>
        </div>

        <div className="mobile-card">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="minimal-label flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="minimal-input w-full"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="minimal-label flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="minimal-input w-full"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-300 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="mobile-btn-primary w-full justify-center"
            >
              {isUpdating ? 'Updating…' : 'Update Password'}
            </button>

            {!hasSession && (
              <p className="mobile-text-xs text-gray-400 mt-2">
                No active recovery session detected. Open the reset link from your email again.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

