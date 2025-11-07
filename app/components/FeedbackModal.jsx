import { useState, useEffect } from 'react';
import { X, Bug, Sparkles, Lightbulb, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../providers/ToastProvider';

export default function FeedbackModal({ isOpen, onClose }) {
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUser();
      // Capture current page URL
      setDescription(prev => prev || `Page: ${window.location.href}\n\n`);
    } else {
      // Reset form when modal closes
      setType('bug');
      setTitle('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const loadUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Get user profile for name and email
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', currentUser.id)
          .single();
        
        if (profile) {
          setUser({ ...currentUser, ...profile });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something isn\'t working' },
    { value: 'feature', label: 'Feature Request', icon: Sparkles, description: 'I have an idea' },
    { value: 'improvement', label: 'Improvement', icon: Lightbulb, description: 'Make something better' },
    { value: 'other', label: 'Other', icon: MessageSquare, description: 'General feedback' },
  ];

  const handleSubmit = async () => {
    setError('');
    
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    
    try {
      const pageUrl = window.location.href;
      
      const feedbackData = {
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.full_name || user?.email || 'Anonymous',
        type: type,
        title: title.trim(),
        description: description.trim(),
        page_url: pageUrl,
        status: 'open',
        priority: 'medium',
      };
      
      const { error: insertError } = await supabase
        .from('feedback')
        .insert([feedbackData]);
      
      if (insertError) {
        throw insertError;
      }
      
      showToast('success', 'Feedback Submitted!', 'Thank you for your feedback. We\'ll review it soon!');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('error', 'Failed to Submit', error.message || 'Please try again');
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedType = feedbackTypes.find(t => t.value === type);

  return (
    <div className="minimal-modal-overlay open" onClick={handleClose}>
      <div className="minimal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="minimal-modal-header">
          <h2 className="minimal-modal-title">
            Share Your Feedback
          </h2>
          <button onClick={onClose} className="minimal-modal-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="minimal-modal-body">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          {/* Feedback Type Selection */}
          <div className="minimal-form-group">
            <label className="minimal-label mb-3">
              What type of feedback is this? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {feedbackTypes.map((feedbackType) => {
                const Icon = feedbackType.icon;
                const isSelected = type === feedbackType.value;
                return (
                  <button
                    key={feedbackType.value}
                    type="button"
                    onClick={() => setType(feedbackType.value)}
                    disabled={submitting}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200
                      flex flex-col items-center text-center
                      ${isSelected
                        ? 'border-[#00d4ff] bg-[#00d4ff]/15 shadow-lg shadow-[#00d4ff]/20'
                        : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/60 active:scale-[0.98]'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700/50 disabled:hover:bg-gray-800/40
                    `}
                  >
                    <Icon className={`w-6 h-6 mb-2 transition-colors duration-200 ${isSelected ? 'text-[#00d4ff]' : 'text-gray-400'}`} />
                    <div className={`text-sm font-semibold mb-1 transition-colors duration-200 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {feedbackType.label}
                    </div>
                    <div className={`text-xs transition-colors duration-200 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {feedbackType.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="minimal-form-group">
            <label htmlFor="feedback-title" className="minimal-label">
              Title *
            </label>
            <input
              type="text"
              id="feedback-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="minimal-input"
              placeholder={`Brief summary of your ${selectedType?.label.toLowerCase() || 'feedback'}`}
              maxLength={100}
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="minimal-form-group">
            <label htmlFor="feedback-description" className="minimal-label">
              Description *
            </label>
            <textarea
              id="feedback-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="minimal-textarea"
              rows={8}
              placeholder={`Please provide details about your ${selectedType?.label.toLowerCase() || 'feedback'}...`}
              maxLength={2000}
              disabled={submitting}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {description.length} / 2000 characters
            </div>
          </div>

          {/* User Info (if logged in) */}
          {user && (
            <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Submitting as:</p>
              <p className="text-sm text-white">
                {user.full_name || user.email}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={title.trim().length < 5 || description.trim().length < 10 || submitting}
              className="flex-1 px-4 py-2 bg-[#00d4ff] hover:bg-[#00b8e6] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


