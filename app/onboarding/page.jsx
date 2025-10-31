import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import OnboardingSkeleton from '../components/OnboardingSkeleton';

const HANDLE_REGEX = /^[A-Za-z0-9._-]{3,20}$/;

function slugifyToHandle(input) {
  const base = (input || '')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '') // remove diacritics remnants/symbols
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .slice(0, 20);
  const lower = base.toLowerCase();
  // Ensure only allowed chars
  const cleaned = lower.replace(/[^a-z0-9._-]/g, '');
  // Pad if too short
  if (cleaned.length < 3) {
    return (cleaned + 'user').slice(0, 3);
  }
  return cleaned;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.nickname && profile?.handle) {
        navigate('/communities');
        return;
      }

      setNickname(profile?.nickname || '');
      setLoading(false);
    };
    init();
  }, [navigate]);

  const generateUniqueHandle = async (baseNickname) => {
    let handle = slugifyToHandle(baseNickname);
    if (!HANDLE_REGEX.test(handle)) {
      // Fallback
      handle = slugifyToHandle('user');
    }

    // Check availability; try with numeric suffixes up to a small limit
    const maxAttempts = 20;
    let attempt = 0;
    let candidate = handle;
    // Exclude current user id if profile exists
    while (attempt < maxAttempts) {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('handle', candidate)
        .limit(1);
      if (qErr) {
        // On query error, break and use candidate to avoid blocking
        break;
      }
      const taken = Array.isArray(data) && data.length > 0 && data[0].id !== userId;
      if (!taken) return candidate;
      attempt += 1;
      const suffix = attempt < 10 ? `-${attempt}` : `-${Math.floor(10 + Math.random() * 89)}`;
      candidate = (handle + suffix).slice(0, 20);
      if (!HANDLE_REGEX.test(candidate)) {
        // Trim more if needed
        candidate = candidate.replace(/[^A-Za-z0-9._-]/g, '');
        if (candidate.length < 3) candidate = (handle + 'x').slice(0, 3);
      }
    }
    return candidate;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Display name is required');
      return;
    }

    try {
      setSaving(true);
      const handle = await generateUniqueHandle(trimmed);

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: userId,
        nickname: trimmed,
        handle,
        full_name: trimmed,
        updated_at: new Date().toISOString()
      });
      if (upsertError) {
        setError(upsertError.message || 'Failed to save');
        setSaving(false);
        return;
      }
      navigate('/communities');
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a1b 0%, #252526 100%)' }}>
        <div className="mobile-card">
          <div className="minimal-flex-center py-8">
            <div className="minimal-spinner"></div>
            <p className="minimal-text ml-3">Preparing onboarding…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a1b 0%, #252526 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome</h1>
          <p className="mobile-text-sm text-gray-400">Choose how your name appears</p>
        </div>
        <div className="mobile-card">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="minimal-label mb-2">Display name</label>
              <input
                name="nickname"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); if (error) setError(''); }}
                className="minimal-input w-full"
                placeholder="e.g., Rami"
                required
              />
              <p className="mobile-text-xs text-gray-500 mt-1">You can change this later in your profile.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={saving} className="mobile-btn-primary w-full justify-center">
              {saving ? 'Saving…' : 'Finish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
