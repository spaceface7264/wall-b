import { useState } from 'react';
import { Send } from 'lucide-react';
import { validateContent } from '../../lib/content-filter';
import { scanContentForNSFW, markContentAsNSFW } from '../../lib/nsfw-detection';

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
  const [contentWarning, setContentWarning] = useState(null);
  const maxLength = 500;

  // Blocked words checking is disabled

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      return;
    }

    // Validate content before submission
    const validation = await validateContent(content, 'comment');
    
    if (!validation.valid) {
      // Show error but don't submit
      setContentWarning(validation.error || 'Content cannot be posted.');
      return;
    }

    // Scan for NSFW content - NSFW content is not allowed
    const nsfwResult = await scanContentForNSFW({
      text: content.trim()
    });

    console.log('NSFW scan result for comment:', nsfwResult);

    // If NSFW detected, block the comment (lower threshold for URL detection)
    // Block if: confidence > 0.5 OR if URL is detected (URL detection is very reliable)
    if (nsfwResult.isNsfw && (nsfwResult.confidence > 0.5 || nsfwResult.urls?.length > 0)) {
      setContentWarning('NSFW or inappropriate content is not allowed on this platform.');
      console.log('Comment blocked due to NSFW content:', nsfwResult);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        postId,
        parentCommentId,
        content: content.trim(),
        is_nsfw: false, // NSFW content is not allowed
      });
      
      // If comment was created, log NSFW scan result (for monitoring)
      if (result?.id && nsfwResult.isNsfw) {
        await markContentAsNSFW(
          result.id,
          'comment',
          false, // Marked as false since NSFW is blocked
          nsfwResult.confidence,
          'auto-detected-blocked'
        );
      }
      
      setContent('');
      setContentWarning(null);
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
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent resize-none pr-12"
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
              disabled={
                content.trim().length < 10 || 
                submitting
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#00d4ff] hover:text-[#00d4ff] disabled:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        {(showCharCount || (content.length > 0 && content.length < 10) || contentWarning) && (
          <div className="text-xs text-gray-400 flex items-center justify-end gap-2">
            {contentWarning && (
              <span className="text-yellow-400">
                {contentWarning}
              </span>
            )}
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
          {contentWarning && (
            <span className="text-yellow-400">
              {contentWarning}
            </span>
          )}
          {!contentWarning && showCharCount && (
            <span className={content.length >= maxLength ? 'text-red-400' : ''}>
              {content.length}/{maxLength}
            </span>
          )}
          {!contentWarning && !showCharCount && content.length > 0 && content.length < 10 && (
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
            disabled={
              content.trim().length < 10 || 
              submitting
            }
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

