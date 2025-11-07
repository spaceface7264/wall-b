import { useState } from 'react';
import { X, VolumeX } from 'lucide-react';
import { muteUser } from '../../lib/user-blocking';
import { useToast } from '../providers/ToastProvider';

export default function MuteUserModal({ isOpen, onClose, userId, userName }) {
  const [duration, setDuration] = useState('permanent'); // 'permanent', '1day', '7days', '30days'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      let expiresAt = null;
      if (duration !== 'permanent') {
        const days = parseInt(duration.replace('days', '').replace('day', ''));
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const result = await muteUser(userId, expiresAt);

      if (!result.success) {
        setError(result.error || 'Failed to mute user');
        setSubmitting(false);
        return;
      }

      const durationText = duration === 'permanent' ? 'permanently' : `for ${duration}`;
      showToast('success', 'User Muted', `${userName || 'User'} has been muted ${durationText}. Their content will be hidden.`);
      
      // Dispatch event to notify all components that a user was muted
      window.dispatchEvent(new CustomEvent('userMuted', { detail: { userId } }));
      
      setDuration('permanent');
      onClose(true);
    } catch (err) {
      console.error('Error muting user:', err);
      setError(err.message || 'Failed to mute user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setDuration('permanent');
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
            <VolumeX className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Mute User</h2>
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
              Muting: <span className="font-medium text-white">{userName || 'User'}</span>
            </p>
            <p className="text-sm text-gray-400 mb-4">
              When you mute someone, their posts and comments will be hidden from you. They can still interact with your content. Unlike blocking, you can still see their profile and they can still message you.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mute Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent"
              disabled={submitting}
            >
              <option value="permanent">Permanent (until you unmute)</option>
              <option value="1day">1 Day</option>
              <option value="7days">7 Days</option>
              <option value="30days">30 Days</option>
            </select>
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
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Muting...
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  Mute User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
