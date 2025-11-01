import { useState, useEffect } from 'react';
import { X, Send, Paperclip, Calendar } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import { supabase } from '../../lib/supabase';

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
  const { showToast } = useToast();

  const titleMaxLength = 200;
  const contentMaxLength = 2000;

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
  };

  const handleEventSelect = (event) => {
    const beforeMention = content.substring(0, eventMentionPosition);
    const afterMention = content.substring(eventMentionPosition + 7);
    const newContent = `${beforeMention}@event:${event.title}${afterMention}`;
    
    setContent(newContent);
    setShowEventPicker(false);
  };

  const handleKeyDown = (e) => {
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


    setSubmitting(true);
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        tag,
        community_id: communityId,
        post_type: 'post', // Fixed: use 'post' instead of tag value
        media_files: mediaFiles,
      };
      
      
      await onSubmit(postData);
      showToast('success', 'Posted!', 'Your post is now live! 📝');
      onClose();
    } catch (error) {
      console.error('Error submitting post:', error);
      showToast('error', 'Failed', 'Failed to create post. Please try again.');
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
      className="fixed inset-0 bg-gray-900 z-50"
      onClick={handleClose}
    >
      <div className="h-full flex flex-col pb-20" onClick={(e) => e.stopPropagation()}>
        {/* Header - Who is posting where */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#087E8B] rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{userName}</div>
              <div className="text-gray-400 text-xs">in {communityName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, titleMaxLength))}
            placeholder="Title"
            className="w-full bg-transparent text-white text-2xl placeholder-gray-500 border-none outline-none resize-none flex-shrink-0"
            disabled={submitting}
          />

          {/* Content Textarea - 50% height */}
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Write something... (Type @event to mention an event)"
            className="w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none mt-4 text-lg"
            style={{ height: '30vh', minHeight: '120px' }}
            disabled={submitting}
          />

          {/* Event Mention Picker */}
          {showEventPicker && (
            <div className="absolute z-10 mt-2 w-full max-w-md bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator Line */}
          <div className="border-t border-gray-700 my-4"></div>

          {/* Paperclip and Post Button Section */}
          <div className="flex items-center justify-between py-4">
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  console.log('📎 Paperclip file input selected files:', files);
                  
                  // Process files through MediaUpload logic
                  const processedFiles = await Promise.all(files.map(async (file) => {
                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
                    if (!allowedTypes.includes(file.type)) {
                      throw new Error(`File type ${file.type} not supported`);
                    }

                    // Validate file size (max 25MB)
                    if (file.size > 25 * 1024 * 1024) {
                      throw new Error(`File ${file.name} is too large. Maximum size is 25MB`);
                    }

                    // Create unique filename
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                    // Upload to Supabase Storage

                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('post-media')
                      .upload(fileName, file);

                    if (uploadError) {
                      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                      .from('post-media')
                      .getPublicUrl(fileName);

                    return {
                      name: file.name,
                      url: publicUrl,
                      type: file.type,
                      size: file.size
                    };
                  }));

                  console.log('📎 Processed files:', processedFiles);
                  setMediaFiles(prev => [...prev, ...processedFiles]);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={submitting}
              />
              <button
                className="text-gray-400 hover:text-white transition-colors p-2"
                disabled={submitting}
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

