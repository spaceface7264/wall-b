import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../providers/ToastProvider';

export default function ReportPostModal({ isOpen, onClose, postId, postTitle }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const reportReasons = [
    'Inappropriate content',
    'Spam or scam',
    'Harassment or bullying',
    'Violence or threats',
    'Hate speech',
    'Misinformation',
    'Copyright violation',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason && !description.trim()) {
      setError('Please provide a reason or description for the report');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to report a post');
        return;
      }

      // Check if user has already reported this post (pending status)
      const { data: existingReport } = await supabase
        .from('post_reports')
        .select('id')
        .eq('post_id', postId)
        .eq('reported_by', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingReport) {
        setError('You have already reported this post. Please wait for admin review.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          reported_by: user.id,
          reason: reason || null,
          description: description.trim() || null
        });

      if (insertError) {
        throw insertError;
      }

      // Reset form
      setReason('');
      setDescription('');
      showToast('success', 'Report Submitted', 'Your report has been submitted and will be reviewed by moderators.');
      onClose(true); // Pass true to indicate success
    } catch (err) {
      console.error('Error reporting post:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      setDescription('');
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
            <Flag className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Report Post</h2>
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
              Reporting post: <span className="font-medium text-white">{postTitle || 'Untitled Post'}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for reporting (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent"
              disabled={submitting}
            >
              <option value="">Select a reason...</option>
              {reportReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional information that might help us review this report..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
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
              disabled={submitting || (!reason && !description.trim())}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

