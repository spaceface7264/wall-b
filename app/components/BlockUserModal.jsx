import { useState } from 'react';
import { X, Ban } from 'lucide-react';
import { blockUser } from '../../lib/user-blocking';
import { useToast } from '../providers/ToastProvider';

export default function BlockUserModal({ isOpen, onClose, userId, userName }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const result = await blockUser(userId, reason || null);

      if (!result.success) {
        setError(result.error || 'Failed to block user');
        setSubmitting(false);
        return;
      }

      showToast('success', 'User Blocked', `${userName || 'User'} has been blocked. Their content will be hidden.`);
      
      // Dispatch event to notify all components that a user was blocked
      window.dispatchEvent(new CustomEvent('userBlocked', { detail: { userId } }));
      
      setReason('');
      onClose(true);
    } catch (err) {
      console.error('Error blocking user:', err);
      setError(err.message || 'Failed to block user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
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
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Block User</h2>
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
              Blocking: <span className="font-medium text-white">{userName || 'User'}</span>
            </p>
            <p className="text-sm text-gray-400 mb-4">
              When you block someone, you won't see their posts, comments, or messages. They won't be notified that you've blocked them.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Reason (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you blocking this user?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">{reason.length}/200</p>
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
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Blocking...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Block User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
