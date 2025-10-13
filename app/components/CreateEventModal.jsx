'use client';

import { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock } from 'lucide-react';

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
  const [success, setSuccess] = useState(false);

  const eventTypes = [
    { value: 'meetup', label: 'Meetup', icon: '📅', color: '#3b82f6' },
    { value: 'competition', label: 'Competition', icon: '🏆', color: '#ef4444' },
    { value: 'training', label: 'Training', icon: '💪', color: '#8b5cf6' },
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
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
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
    <div className="minimal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="minimal-modal-header">
          <h2 className="minimal-modal-title">
            {editMode ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="minimal-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="minimal-modal-body">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-300 text-sm">Event created successfully! 🎉</p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="title" className="minimal-text block mb-2">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="minimal-input"
              placeholder="Enter event title"
              maxLength={100}
              disabled={submitting || success}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="minimal-text block mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="minimal-input h-24 resize-y"
              placeholder="Describe your event..."
              maxLength={500}
              disabled={submitting || success}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="eventDate" className="minimal-text block mb-2">
                Date
              </label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="minimal-input"
                min={getMinDateTime()}
                disabled={submitting || success}
              />
            </div>
            <div>
              <label htmlFor="eventTime" className="minimal-text block mb-2">
                Time
              </label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="minimal-input"
                disabled={submitting || success}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="location" className="minimal-text block mb-2">
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
              disabled={submitting || success}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="eventType" className="minimal-text block mb-2">
              Event Type
            </label>
            <select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="minimal-input"
              disabled={submitting || success}
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="maxParticipants" className="minimal-text block mb-2">
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
              disabled={submitting || success}
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
              submitting ||
              success
            }
            className="mobile-btn-primary"
          >
            {success ? 'Event Created! 🎉' : submitting ? 'Creating...' : (editMode ? 'Save Changes' : 'Create Event')}
            {!success && <Calendar size={16} />}
          </button>
        </div>
    </div>
  );
}
