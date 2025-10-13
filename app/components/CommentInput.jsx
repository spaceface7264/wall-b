import { useState } from 'react';
import { Send } from 'lucide-react';

export default function CommentInput({
  postId,
  parentCommentId = null,
  onSubmit,
  placeholder = "Add a comment...",
  autoFocus = false,
  onCancel = null,
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

  return (
    <div className={`${parentCommentId ? 'p-3 bg-gray-800/20 rounded-lg' : 'mobile-card-flat p-comfortable'}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="minimal-textarea w-full"
        rows={3}
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
            className="mobile-btn-primary minimal-flex gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="minimal-icon" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

