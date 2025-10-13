import { useState } from 'react';
import { X, Send } from 'lucide-react';
import MediaUpload from './MediaUpload';

export default function CreatePostModal({
  communityId,
  onClose,
  onSubmit,
  editMode = false,
  initialData = null,
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tag, setTag] = useState(initialData?.tag || 'general');
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState(initialData?.media_files || []);

  const titleMaxLength = 200;
  const contentMaxLength = 2000;

  const tags = [
    { value: 'general', label: 'General', color: '#6b7280' },
    { value: 'beta', label: 'Beta', color: '#ef4444' },
    { value: 'event', label: 'Events', color: '#3b82f6' },
    { value: 'question', label: 'Questions', color: '#10b981' },
    { value: 'gear', label: 'Gear', color: '#f59e0b' },
    { value: 'training', label: 'Training', color: '#8b5cf6' },
    { value: 'social', label: 'Social', color: '#ec4899' },
    { value: 'news', label: 'News', color: '#6b7280' },
  ];

  const handleSubmit = async () => {
    if (title.trim().length < 5 || content.trim().length < 10) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tag,
        community_id: communityId,
        post_type: 'post', // Fixed: use 'post' instead of tag value
        media_files: mediaFiles,
      });
      onClose();
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const showTitleCharCount = title.length > titleMaxLength * 0.8;
  const showContentCharCount = content.length > contentMaxLength * 0.8;

  return (
    <div
      className="minimal-modal-overlay open"
      onClick={handleClose}
    >
      <div className="minimal-modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        {/* Modal Header */}
        <div className="minimal-modal-header">
          <h2 className="minimal-modal-title">
            {editMode ? 'Edit Post' : 'Create Post'}
          </h2>
          <button
            onClick={onClose}
            className="minimal-modal-close"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="minimal-modal-body">
          {/* Title Input */}
          <div className="minimal-form-group">
            <label className="minimal-label">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, titleMaxLength))}
              placeholder="Enter post title..."
              className="minimal-input"
              disabled={submitting}
            />
            <div className="minimal-flex justify-between items-center mt-1">
              <span className="mobile-text-xs text-gray-400">
                {title.length < 5 && title.length > 0 && (
                  <span className="text-yellow-400">Minimum 5 characters</span>
                )}
              </span>
              {showTitleCharCount && (
                <span className={`mobile-text-xs ${
                  title.length >= titleMaxLength ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {title.length}/{titleMaxLength}
                </span>
              )}
            </div>
          </div>

          {/* Content Textarea */}
          <div className="minimal-form-group">
            <label className="minimal-label">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, contentMaxLength))}
              placeholder="Share your thoughts, ask a question, or share some beta..."
              className="minimal-textarea"
              rows={8}
              disabled={submitting}
            />
            <div className="minimal-flex justify-between items-center mt-1">
              <span className="mobile-text-xs text-gray-400">
                {content.length < 10 && content.length > 0 && (
                  <span className="text-yellow-400">Minimum 10 characters</span>
                )}
              </span>
              {showContentCharCount && (
                <span className={`mobile-text-xs ${
                  content.length >= contentMaxLength ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {content.length}/{contentMaxLength}
                </span>
              )}
            </div>
          </div>

          {/* Tag Selection */}
          <div className="minimal-form-group">
            <label className="minimal-label">
              Tag *
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="minimal-select"
              disabled={submitting}
            >
              {tags.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mobile-text-xs text-gray-400 mt-1">
              Choose the most appropriate tag for your post
            </p>
          </div>
        </div>

        {/* Media Upload */}
        <div>
          <label className="minimal-text block mb-2">Media (Optional)</label>
          <MediaUpload
            onUpload={(files) => setMediaFiles(prev => [...prev, ...files])}
            onRemove={(index) => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
            uploadedFiles={mediaFiles}
            maxFiles={5}
            bucket="post-media"
          />
        </div>

        {/* Modal Actions */}
        <div className="minimal-modal-actions">
          <button
            onClick={onClose}
            disabled={submitting}
            className="mobile-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              title.trim().length < 5 ||
              content.trim().length < 10 ||
              submitting
            }
            className="mobile-btn-primary minimal-flex gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {editMode ? 'Saving...' : 'Posting...'}
              </>
            ) : (
              <>
                <Send className="minimal-icon" />
                {editMode ? 'Save Changes' : 'Post'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

