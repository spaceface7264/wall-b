import { useState } from 'react';
import { X, Ban, Clock } from 'lucide-react';
import { suspendUser } from '../../lib/suspension-utils';
import { useToast } from '../providers/ToastProvider';

export default function SuspendUserModal({ isOpen, onClose, userId, userName }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('24h'); // '24h', '7d', '30d', 'permanent'
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for the suspension');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let expiresAt = null;
      if (duration !== 'permanent') {
        const expires = new Date();
        if (duration === '24h') {
          expires.setHours(expires.getHours() + 24);
        } else if (duration === '7d') {
          expires.setDate(expires.getDate() + 7);
        } else if (duration === '30d') {
          expires.setDate(expires.getDate() + 30);
        }
        expiresAt = expires;
      }

      const result = await suspendUser(userId, reason.trim(), expiresAt, notes.trim() || null);

      if (!result.success) {
        setError(result.error || 'Failed to suspend user');
        setSubmitting(false);
        return;
      }

      const durationText = duration === 'permanent' ? 'permanently' : `for ${duration}`;
      showToast('success', 'User Suspended', `${userName || 'User'} has been suspended ${durationText}.`);
      setReason('');
      setNotes('');
      setDuration('24h');
      onClose(true);
    } catch (err) {
      console.error('Error suspending user:', err);
      setError(err.message || 'Failed to suspend user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      setNotes('');
      setDuration('24h');
      setError(null);
      onClose(false);
    }
  };

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
            <Ban className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Suspend User</h2>
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
              Suspending: <span className="font-medium text-white">{userName || 'User'}</span>
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Suspended users will be unable to post, comment, or interact with the platform during the suspension period.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Suspension <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this user being suspended?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent resize-none"
              disabled={submitting}
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{reason.length}/500</p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Suspension Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
              disabled={submitting}
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="permanent">Permanent (Ban)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for other moderators..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{notes.length}/300</p>
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
              disabled={submitting || !reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Suspending...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Suspend User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
