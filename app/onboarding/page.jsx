import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import OnboardingSkeleton from '../components/OnboardingSkeleton';
import { Users, MapPin, UsersRound, BookOpen, Share2, Calendar, Shield } from 'lucide-react';
import { verifyAge } from '../../lib/age-verification';
import StarfieldBackground from '../components/StarfieldBackground';

const HANDLE_REGEX = /^[A-Za-z0-9._-]{3,20}$/;

// Purpose options for user intent
const PURPOSE_OPTIONS = [
  { id: 'find_partners', label: 'Find climbing partners', icon: Users, description: 'Connect with other climbers' },
  { id: 'discover_gyms', label: 'Discover new gyms', icon: MapPin, description: 'Explore climbing gyms near you' },
  { id: 'join_communities', label: 'Join communities', icon: UsersRound, description: 'Be part of climbing communities' },
  { id: 'learn_techniques', label: 'Learn climbing techniques', icon: BookOpen, description: 'Improve your climbing skills' },
  { id: 'share_progress', label: 'Share my climbing progress', icon: Share2, description: 'Track and share your journey' },
  { id: 'find_events', label: 'Find climbing events', icon: Calendar, description: 'Discover meetups and competitions' }
];

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
  const [step, setStep] = useState('displayName'); // 'displayName', 'ageVerification', or 'purpose'
  const [nickname, setNickname] = useState('');
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  const [dateOfBirth, setDateOfBirth] = useState('');

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

      // If profile is complete (has nickname, handle, age_verified, and user_intent), go to home
      if (profile?.nickname && profile?.handle && profile?.age_verified && profile?.user_intent && profile.user_intent.length > 0) {
        navigate('/home');
        return;
      }

      // Check which step to show
      if (profile?.nickname && profile?.handle && profile?.age_verified) {
        // Has name and age, but no purpose
        setStep('purpose');
        setNickname(profile.nickname);
      } else if (profile?.nickname && profile?.handle) {
        // Has name but no age verification
        setStep('ageVerification');
        setNickname(profile.nickname);
        setDateOfBirth(profile.date_of_birth || '');
      } else {
        // Start with display name
        setNickname(profile?.nickname || '');
      }

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

  const onSubmitDisplayName = async (e) => {
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
      // Move to age verification step
      setStep('ageVerification');
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitPurpose = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedPurposes.length === 0) {
      setError('Please select at least one purpose');
      return;
    }

    try {
      setSaving(true);

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: userId,
        user_intent: selectedPurposes,
        updated_at: new Date().toISOString()
      });
      if (upsertError) {
        setError(upsertError.message || 'Failed to save');
        setSaving(false);
        return;
      }
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAgeVerification = async (e) => {
    e.preventDefault();
    setError('');

    if (!dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    // Validate date of birth - automatically check if user is 16+
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      setError('You must be 16 years or older to use this platform. You are ' + age + ' years old.');
      return;
    }

    try {
      setSaving(true);
      const dob = new Date(dateOfBirth);
      // Pass true for ageConfirmed since we've validated the age from DOB
      const result = await verifyAge(true, dob);

      if (!result.success) {
        setError(result.error || 'Failed to verify age');
        setSaving(false);
        return;
      }

      // Move to purpose selection step
      setStep('purpose');
    } catch (err) {
      setError(err.message || 'Failed to verify age');
    } finally {
      setSaving(false);
    }
  };

  const togglePurpose = (purposeId) => {
    setSelectedPurposes(prev => 
      prev.includes(purposeId) 
        ? prev.filter(id => id !== purposeId)
        : [...prev, purposeId]
    );
    if (error) setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <StarfieldBackground />
        <div className="mobile-card relative z-10">
          <div className="minimal-flex-center py-8">
            <div className="minimal-spinner"></div>
            <p className="minimal-text ml-3">Preparing onboarding…</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate max date for date picker (must be at least 16 years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 16);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Display name step
  if (step === 'displayName') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <StarfieldBackground />
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome</h1>
            <p className="mobile-text-sm" style={{ color: 'var(--text-muted)' }}>Choose how your name appears</p>
          </div>
          <div className="mobile-card">
            <form onSubmit={onSubmitDisplayName} className="space-y-4">
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
                {saving ? 'Saving…' : 'Next'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Age verification step
  if (step === 'ageVerification') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <StarfieldBackground />
        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-[#087E8B]" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Age Verification</h1>
            <p className="mobile-text-sm" style={{ color: 'var(--text-muted)' }}>You must be 16 years or older to use this platform</p>
          </div>
          <div className="mobile-card">
            <form onSubmit={onSubmitAgeVerification} className="space-y-4">
              <div>
                <label className="minimal-label mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (error) setError('');
                  }}
                  max={maxDateString}
                  disabled={saving}
                  className="minimal-input w-full"
                  required
                />
                <p className="mobile-text-xs text-gray-500 mt-1">You must be 16 years or older to use this platform.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={saving || !dateOfBirth} className="mobile-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Purpose selection step
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <StarfieldBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>What brings you here?</h1>
          <p className="mobile-text-sm" style={{ color: 'var(--text-muted)' }}>Select what you're looking for (you can choose multiple)</p>
        </div>
        <div className="mobile-card">
          <form onSubmit={onSubmitPurpose} className="space-y-4">
            <div className="space-y-3">
              {PURPOSE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedPurposes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => togglePurpose(option.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600' : 'bg-gray-700'}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          {option.label}
                        </h3>
                        <p className="mobile-text-xs" style={{ color: 'var(--text-muted)' }}>
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={saving || selectedPurposes.length === 0} 
              className="mobile-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Finish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
