import { useState } from 'react';
import { X, Shield, Calendar } from 'lucide-react';
import { verifyAge } from '../../lib/age-verification';
import { useToast } from '../providers/ToastProvider';

export default function AgeVerificationModal({ isOpen, onClose, requiredAge = 13 }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [useDOB, setUseDOB] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ageConfirmed) {
      setError('Please confirm that you meet the age requirement');
      return;
    }

    if (useDOB && !dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    // Validate date of birth if provided
    if (useDOB && dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < requiredAge) {
        setError(`You must be ${requiredAge} years or older. You are ${age} years old.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const dob = useDOB && dateOfBirth ? new Date(dateOfBirth) : null;
      const result = await verifyAge(ageConfirmed, dob);

      if (!result.success) {
        setError(result.error || 'Failed to verify age');
        setSubmitting(false);
        return;
      }

      showToast('success', 'Age Verified', 'Your age has been verified successfully.');
      setAgeConfirmed(false);
      setDateOfBirth('');
      setUseDOB(false);
      onClose(true);
    } catch (err) {
      console.error('Error verifying age:', err);
      setError(err.message || 'Failed to verify age. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setAgeConfirmed(false);
      setDateOfBirth('');
      setUseDOB(false);
      setError(null);
      onClose(false);
    }
  };

  // Calculate max date for date picker (must be at least requiredAge years ago)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - requiredAge);
  const maxDateString = maxDate.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div 
        className="mobile-card w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2663EB]" />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Age Verification</h2>
          </div>
          <button 
            onClick={handleClose} 
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-300 mb-4">
              You must be <span className="font-medium text-white">{requiredAge} years or older</span> to access this content.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              This is required by law (COPPA) and our Terms of Service to protect minors.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Age Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <input
              type="checkbox"
              id="age-confirm"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#2663EB] focus:ring-[#2663EB] focus:ring-offset-gray-900 disabled:opacity-50"
            />
            <label htmlFor="age-confirm" className="text-sm text-gray-300 cursor-pointer">
              I confirm that I am {requiredAge} years of age or older
            </label>
          </div>

          {/* Optional Date of Birth */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-dob"
                checked={useDOB}
                onChange={(e) => setUseDOB(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#2663EB] focus:ring-[#2663EB] focus:ring-offset-gray-900 disabled:opacity-50"
              />
              <label htmlFor="use-dob" className="text-sm text-gray-400 cursor-pointer">
                Optional: Enter date of birth for strict verification
              </label>
            </div>

            {useDOB && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={maxDateString}
                  disabled={submitting}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !ageConfirmed}
              className="flex-1 px-4 py-2 bg-[#2663EB] hover:bg-[#1e4fd4] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify Age
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
