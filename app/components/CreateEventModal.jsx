

import { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';

export default function CreateEventModal({
  communityId,
  onClose,
  onSubmit,
  editMode = false,
  initialData = null,
}) {
  console.log('CreateEventModal rendered with communityId:', communityId);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [eventDate, setEventDate] = useState(initialData?.event_date ? initialData.event_date.split('T')[0] : '');
  const [eventTime, setEventTime] = useState(initialData?.event_date ? initialData.event_date.split('T')[1]?.substring(0, 5) : '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [eventType, setEventType] = useState(initialData?.event_type || 'meetup');
  const [maxParticipants, setMaxParticipants] = useState(initialData?.max_participants || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const eventTypes = [
    { value: 'meetup', label: 'Meetup', icon: '📅', color: '#3b82f6' },
    { value: 'competition', label: 'Competition', icon: '🏆', color: '#ef4444' },
    { value: 'training', label: 'Training', icon: '💪', color: '#2663EB' },
    { value: 'social', label: 'Social', icon: '🎉', color: '#ec4899' },
  ];

  const handleSubmit = async () => {
    setError('');
    
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (!eventDate || !eventTime) {
      setError('Please select both date and time');
      return;
    }

    setSubmitting(true);
    
    try {
      const eventDateTime = new Date(`${eventDate}T${eventTime}:00`).toISOString();
      
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: eventDateTime,
        location: location.trim() || null,
        event_type: eventType,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        community_id: communityId,
      };
      
      await onSubmit(eventData);
      
      showToast('success', 'Event Created!', `${title} has been scheduled! 🎉`);
      onClose();
    } catch (error) {
      showToast('error', 'Failed', error.message || 'Please try again');
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="minimal-modal-overlay open" onClick={handleClose}>
      <div className="minimal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="minimal-modal-header">
          <h2 className="minimal-modal-title">
            {editMode ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="minimal-modal-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="minimal-modal-body">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          
          <div className="minimal-form-group">
            <label htmlFor="title" className="minimal-label">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="minimal-input"
              placeholder="Enter event title"
              maxLength={100}
              disabled={submitting}
            />
          </div>

          <div className="minimal-form-group">
            <label htmlFor="description" className="minimal-label">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="minimal-textarea"
              rows={6}
              placeholder="Describe your event..."
              maxLength={500}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="minimal-form-group">
              <label htmlFor="eventDate" className="minimal-label">
                Date *
              </label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="minimal-input"
                min={getMinDateTime()}
                disabled={submitting}
              />
            </div>
            <div className="minimal-form-group">
              <label htmlFor="eventTime" className="minimal-label">
                Time *
              </label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="minimal-input"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="minimal-form-group">
            <label htmlFor="location" className="minimal-label">
              Location (Optional)
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="minimal-input"
              placeholder="Where will this event take place?"
              maxLength={200}
              disabled={submitting}
            />
          </div>

          <div className="minimal-form-group">
            <label htmlFor="eventType" className="minimal-label">
              Event Type *
            </label>
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="minimal-select"
              disabled={submitting}
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="minimal-form-group">
            <label htmlFor="maxParticipants" className="minimal-label">
              Max Participants (Optional)
            </label>
            <input
              type="number"
              id="maxParticipants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="minimal-input"
              placeholder="Leave empty for unlimited"
              min="1"
              max="1000"
              disabled={submitting}
            />
          </div>
        </div>

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
              title.trim().length < 3 ||
              description.trim().length < 10 ||
              !eventDate ||
              !eventTime ||
              submitting
            }
            className="mobile-btn-primary minimal-flex gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="minimal-icon" />
                {editMode ? 'Save Changes' : 'Create Event'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}