import { useState } from 'react';
import { Send } from 'lucide-react';

export default function CommentInput({
  postId,
  parentCommentId = null,
  onSubmit,
  placeholder = "Add a comment...",
  autoFocus = false,
  onCancel = null,
  compact = false,
}) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const maxLength = 500;

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      return;
    }


    setSubmitting(true);
    try {
      await onSubmit({
        postId,
        parentCommentId,
        content: content.trim(),
      });
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const showCharCount = content.length > maxLength * 0.8;

  // If it's a top-level comment (not a reply), use pill shape design
  if (!parentCommentId && !compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent resize-none pr-12"
              rows={1}
              disabled={submitting}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={content.trim().length < 10 || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#087E8B] hover:text-[#087E8B] disabled:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {(showCharCount || (content.length > 0 && content.length < 10)) && (
          <div className="text-xs text-gray-400 flex items-center justify-end">
            {showCharCount && (
              <span className={content.length >= maxLength ? 'text-red-400' : ''}>
                {content.length}/{maxLength}
              </span>
            )}
            {!showCharCount && content.length > 0 && content.length < 10 && (
              <span className="text-yellow-400">
                Min 10
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Reply input or compact mode - use original design
  return (
    <div className={`${parentCommentId ? 'p-3 bg-gray-800/20 rounded-lg' : compact ? 'p-2' : 'mobile-card-flat p-comfortable'}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="minimal-textarea w-full"
        rows={compact ? 2 : 3}
        disabled={submitting}
      />
      
      <div className="minimal-flex justify-between items-center mt-2">
        <div className="mobile-text-xs text-gray-400">
          {showCharCount && (
            <span className={content.length >= maxLength ? 'text-red-400' : ''}>
              {content.length}/{maxLength}
            </span>
          )}
          {!showCharCount && content.length > 0 && content.length < 10 && (
            <span className="text-yellow-400">
              Minimum 10 characters
            </span>
          )}
        </div>
        
        <div className="minimal-flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={submitting}
              className="mobile-btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={content.trim().length < 10 || submitting}
            className={`mobile-btn-primary minimal-flex gap-2 ${compact ? 'px-4 py-1.5 text-sm' : ''}`}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                {!compact && <Send className="minimal-icon" />}
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

