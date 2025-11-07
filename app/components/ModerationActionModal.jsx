import { useState } from 'react';
import { X, CheckCircle, XCircle, Edit2, Trash2, AlertTriangle, Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../providers/ToastProvider';

export default function ModerationActionModal({ isOpen, onClose, queueItem, onResolved }) {
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const actions = [
    { value: 'approved', label: 'Approve', icon: CheckCircle, color: 'green' },
    { value: 'deleted', label: 'Delete Content', icon: Trash2, color: 'red' },
    { value: 'edited', label: 'Edit Content', icon: Edit2, color: 'blue' },
    { value: 'warned', label: 'Warn User', icon: AlertTriangle, color: 'yellow' },
    { value: 'dismissed', label: 'Dismiss', icon: XCircle, color: 'gray' },
    { value: 'suspended_user', label: 'Suspend User', icon: Ban, color: 'orange' },
    { value: 'banned_user', label: 'Ban User', icon: Ban, color: 'red' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!action) {
      setError('Please select an action');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Record the action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          queue_id: queueItem.id,
          moderator_id: user.id,
          action_taken: action,
          notes: notes.trim() || null
        });

      if (actionError) throw actionError;

      // Update queue status
      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', queueItem.id);

      if (queueError) throw queueError;

      // Perform the action based on type
      if (action === 'deleted') {
        const tableName = queueItem.content_type === 'post' ? 'posts' : 'comments';
        await supabase
          .from(tableName)
          .delete()
          .eq('id', queueItem.content_id);
      }

      showToast('success', 'Action Taken', `Content has been ${action.replace('_', ' ')}.`);
      setAction('');
      setNotes('');
      onClose(true);
      if (onResolved) onResolved();
    } catch (err) {
      console.error('Error taking moderation action:', err);
      setError(err.message || 'Failed to take action. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setAction('');
      setNotes('');
      setError(null);
      onClose(false);
    }
  };

  if (!isOpen || !queueItem) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div 
        className="mobile-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Moderation Action</h2>
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
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-medium">Content Type:</span> {queueItem.content_type}
            </p>
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-medium">Reason:</span> {queueItem.reason}
            </p>
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-medium">Priority:</span> {queueItem.priority}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Action <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((actionOption) => {
                const Icon = actionOption.icon;
                const isSelected = action === actionOption.value;
                return (
                  <button
                    key={actionOption.value}
                    type="button"
                    onClick={() => {
                      setAction(actionOption.value);
                      if (error) setError(null);
                    }}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      isSelected
                        ? `border-${actionOption.color}-600 bg-${actionOption.color}-600/10`
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? `text-${actionOption.color}-400` : 'text-gray-400'}`} />
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {actionOption.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this action..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{notes.length}/500</p>
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
              disabled={submitting || !action}
              className="flex-1 px-4 py-2 bg-[#2663EB] hover:bg-[#1e4fd4] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Action
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
