import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Paperclip, Calendar } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { supabase } from '../../lib/supabase';
import { validateContent } from '../../lib/content-filter';
import { scanContentForNSFW, markContentAsNSFW } from '../../lib/nsfw-detection';

export default function CreatePostModal({
  communityId,
  onClose,
  onSubmit,
  editMode = false,
  initialData = null,
  communityName = 'Community',
  userName = 'User',
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tag, setTag] = useState(initialData?.tag || 'general');
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState(initialData?.media_files || []);
  const [events, setEvents] = useState([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [eventMentionPosition, setEventMentionPosition] = useState(0);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({}); // { fileName: percentage }
  const [uploadingFiles, setUploadingFiles] = useState([]); // Array of file objects being uploaded
  const [lastSaved, setLastSaved] = useState(null);
  const [contentWarning, setContentWarning] = useState(null);
  
  // Refs for focus management
  const titleInputRef = useRef(null);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  
  const { showToast } = useToast();

  const titleMaxLength = 200;
  const contentMaxLength = 2000;

  // Draft storage key
  const draftKey = `post-draft-${communityId}`;

  // Handle close - memoized to avoid recreating on each render
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Focus management: Save previous active element and trap focus
  useEffect(() => {
    // Save the element that had focus before modal opened
    previousActiveElement.current = document.activeElement;
    
    // Auto-focus title input when modal opens
    if (titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }

    // Focus trap: Keep focus within modal
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Close on Escape (unless event picker is open)
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showEventPicker) {
          setShowEventPicker(false);
        } else {
          handleClose();
        }
      }
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('keydown', handleTabKey);
      modal.addEventListener('keydown', handleEscape);
    }

    return () => {
      if (modal) {
        modal.removeEventListener('keydown', handleTabKey);
        modal.removeEventListener('keydown', handleEscape);
      }
      // Return focus to previous element when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [showEventPicker, handleClose]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!editMode && !initialData) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title || draft.content) {
            setTitle(draft.title || '');
            setContent(draft.content || '');
            setTag(draft.tag || 'general');
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [editMode, initialData, draftKey]);

  // Auto-save draft to localStorage every 30 seconds
  useEffect(() => {
    if (editMode || submitting) return;

    const saveDraft = () => {
      if (title.trim() || content.trim()) {
        const draft = {
          title,
          content,
          tag,
          timestamp: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setLastSaved(new Date());
      } else {
        // Clear draft if both fields are empty
        localStorage.removeItem(draftKey);
        setLastSaved(null);
      }
    };

    // Save immediately on change, then every 30 seconds
    saveDraft();
    const intervalId = setInterval(saveDraft, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [title, content, tag, editMode, submitting, draftKey]);

  // Load events for mentions
  useEffect(() => {
    if (communityId) {
      loadEvents();
    }
  }, [communityId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date')
        .eq('community_id', communityId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Event mention detection and handling
  const handleContentChange = (e) => {
    const value = e.target.value.slice(0, contentMaxLength);
    const cursorPosition = e.target.selectionStart;
    
    setContent(value);
    
    // Check for @event mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@event\s*$/);
    
    if (mentionMatch) {
      setShowEventPicker(true);
      setEventMentionPosition(cursorPosition - 7); // Position after @event
      setFilteredEvents(events);
      setSelectedEventIndex(0);
    } else {
      setShowEventPicker(false);
    }

    // Blocked words checking is disabled
  };

  const handleEventSelect = (event) => {
    const beforeMention = content.substring(0, eventMentionPosition);
    const afterMention = content.substring(eventMentionPosition + 7);
    const newContent = `${beforeMention}@event:${event.title}${afterMention}`;
    
    setContent(newContent);
    setShowEventPicker(false);
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submitting) {
      const canSubmit = title.trim().length >= 5 && content.trim().length >= 10;
      if (canSubmit) {
        handleSubmit();
      }
    }

    if (showEventPicker) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedEventIndex(prev => 
          prev < filteredEvents.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedEventIndex(prev => 
          prev > 0 ? prev - 1 : filteredEvents.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredEvents[selectedEventIndex]) {
          handleEventSelect(filteredEvents[selectedEventIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowEventPicker(false);
      }
    }
  };

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

    // Validate content before submission
    const fullText = `${title} ${content}`.trim();
    const validation = await validateContent(fullText, 'post');
    
    if (!validation.valid) {
      showToast('error', 'Content Blocked', validation.error || 'Content cannot be posted.');
      return;
    }

    // Scan for NSFW content - NSFW content is not allowed
    const imageUrls = mediaFiles.map(f => f.url).filter(Boolean);
    const nsfwResult = await scanContentForNSFW({
      text: fullText,
      images: imageUrls
    });

    console.log('NSFW scan result:', nsfwResult);

    // If NSFW detected, block the post (lower threshold for URL detection)
    // Block if: confidence > 0.5 OR if URL is detected (URL detection is very reliable)
    if (nsfwResult.isNsfw && (nsfwResult.confidence > 0.5 || nsfwResult.urls?.length > 0)) {
      showToast('error', 'Content Blocked', 'NSFW or inappropriate content is not allowed on this platform.');
      console.log('Post blocked due to NSFW content:', nsfwResult);
      return;
    }

    // Clear draft on successful submit
    localStorage.removeItem(draftKey);
    setLastSaved(null);

    setSubmitting(true);
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        tag,
        community_id: communityId,
        post_type: 'post',
        media_files: mediaFiles,
        is_nsfw: false, // NSFW content is not allowed
      };
      
      const result = await onSubmit(postData);
      
      // If post was created, log NSFW scan result (for monitoring)
      if (result?.id && nsfwResult.isNsfw) {
        await markContentAsNSFW(
          result.id,
          'post',
          false, // Marked as false since NSFW is blocked
          nsfwResult.confidence,
          'auto-detected-blocked'
        );
      }

      if (validation.warning) {
        showToast('warning', 'Posted with Warning', validation.warning);
      } else {
        showToast('success', 'Posted!', 'Your post is now live! 📝');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting post:', error);
      showToast('error', 'Failed', 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files);
    
    // Process files and create loading placeholders
    const processedFiles = await Promise.all(
      fileArray.map(async (file, index) => {
        // Create unique filename first so we can reference it in error handling
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}.${fileExt}`;
        let progressInterval = null;

        try {
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} not supported`);
          }

          // Validate file size (max 25MB)
          if (file.size > 25 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Maximum size is 25MB`);
          }

          // Add to uploading state with loading placeholder
          const loadingFile = {
            name: file.name,
            fileName: fileName,
            type: file.type,
            size: file.size,
            loading: true,
            url: null,
          };
          setUploadingFiles(prev => [...prev, loadingFile]);

          // Upload to Supabase Storage with progress tracking
          setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

          // Note: Supabase doesn't support progress callbacks directly
          // This is a simulated progress - in production, you might want to use
          // a library that supports upload progress or chunked uploads
          progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[fileName] || 0;
              if (current < 90) {
                return { ...prev, [fileName]: current + 10 };
              }
              return prev;
            });
          }, 200);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, file);

          if (progressInterval) {
            clearInterval(progressInterval);
          }
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

          if (uploadError) {
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);

          // Remove from uploading state
          setUploadingFiles(prev => prev.filter(f => f.fileName !== fileName));
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });

          return {
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
          };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          showToast('error', 'Upload Failed', error.message);
          
          // Clean up progress interval
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          
          // Remove from uploading state on error
          setUploadingFiles(prev => prev.filter(f => f.fileName !== fileName));
          
          // Clear progress
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileName];
            return newProgress;
          });
          
          return null;
        }
      })
    );

    // Filter out failed uploads and add successful ones
    const successfulFiles = processedFiles.filter(file => file !== null);
    setMediaFiles(prev => [...prev, ...successfulFiles]);
  };

  const titleRemaining = titleMaxLength - title.length;
  const contentRemaining = contentMaxLength - content.length;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#252526] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl my-8 md:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Who is posting where */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm text-white">{userName}</div>
              <div className="text-xs text-gray-400">in {communityName}</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
            disabled={submitting}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto">
          {/* Tag Selector */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tagOption) => (
                <button
                  key={tagOption.value}
                  onClick={() => setTag(tagOption.value)}
                  disabled={submitting}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    tag === tagOption.value
                      ? 'text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  style={
                    tag === tagOption.value
                      ? { backgroundColor: tagOption.color }
                      : {}
                  }
                >
                  {tagOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="mb-2">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, titleMaxLength))}
              placeholder="Title"
              className="w-full bg-transparent text-white text-2xl placeholder-gray-500 border-none outline-none resize-none"
              disabled={submitting}
              maxLength={titleMaxLength}
              aria-label="Post title"
            />
            {/* Character count - always visible */}
            <div className="text-xs text-gray-500 mt-1 text-right">
              {titleRemaining} remaining
            </div>
          </div>

          {/* Content Textarea */}
          <div className="mb-2">
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Write something... (Type @event to mention an event)"
              className="w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none text-lg"
              style={{ height: '30vh', minHeight: '120px' }}
              disabled={submitting}
              maxLength={contentMaxLength}
              aria-label="Post content"
            />
            {/* Character count and warnings */}
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs">
                {contentWarning && (
                  <span className="text-yellow-400">
                    {contentWarning}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {contentRemaining} remaining
              </div>
            </div>
          </div>

          {/* Event Mention Picker */}
          {showEventPicker && (
            <div className="relative z-10 mb-4">
              <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Select an event to mention
                  </div>
                  {filteredEvents.length === 0 ? (
                    <div className="text-gray-400 text-sm py-2">No events available</div>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventSelect(event)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          index === selectedEventIndex
                            ? 'bg-[#087E8B] text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Uploading Files - Loading Skeletons */}
          {uploadingFiles.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {uploadingFiles.map((file, index) => (
                  <div key={`loading-${file.fileName || index}`} className="relative">
                    {/* Skeleton loader */}
                    <div className="w-full h-20 bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                      <div className="text-gray-500 text-sm">Uploading...</div>
                    </div>
                    {/* Progress bar */}
                    {file.fileName && uploadProgress[file.fileName] !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-lg overflow-hidden">
                        <div
                          className="h-full bg-[#087E8B] transition-all duration-300"
                          style={{ width: `${uploadProgress[file.fileName]}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Files Preview */}
          {mediaFiles.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">📹</span>
                      </div>
                    )}
                    <button
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      disabled={submitting}
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draft saved indicator */}
          {lastSaved && !editMode && (
            <div className="text-xs text-gray-500 mt-2">
              Draft saved {lastSaved.toLocaleTimeString()}
            </div>
          )}

          {/* Separator Line */}
          <div className="border-t border-gray-700 my-4"></div>

          {/* Paperclip and Post Button Section */}
          <div className="flex items-center justify-between py-2">
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files);
                  }
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={submitting}
                aria-label="Upload media files"
              />
              <button
                className="text-gray-400 hover:text-white transition-colors p-2"
                disabled={submitting}
                aria-label="Upload media"
              >
                <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Post Button */}
            <button
              onClick={handleSubmit}
              disabled={
                title.trim().length < 5 ||
                content.trim().length < 10 ||
                submitting
              }
              className="bg-[#087E8B] hover:bg-[#066a75] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              aria-label={editMode ? 'Save post' : 'Post'}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {editMode ? 'Saving...' : 'Posting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {editMode ? 'Save' : 'Post'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
