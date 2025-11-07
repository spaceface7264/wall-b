import { Calendar, MapPin, Clock, Users, ChevronRight } from 'lucide-react';

export default function EventCard({ 
  event, 
  onRSVP, 
  onOpen,
  rsvpStatus = null,
  rsvpCount = 0,
  maxParticipants = null
}) {
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;
    
    return date.toLocaleDateString();
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      meetup: '#3b82f6',
      competition: '#ef4444',
      training: '#2663EB',
      social: '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'competition':
        return '🏆';
      case 'training':
        return '💪';
      case 'social':
        return '🎉';
      default:
        return '📅';
    }
  };

  const getRSVPButtonText = () => {
    switch (rsvpStatus) {
      case 'going':
        return 'Going';
      case 'interested':
        return 'Interested';
      case 'cant_go':
        return "Can't Go";
      default:
        return 'RSVP';
    }
  };

  const getRSVPButtonClass = () => {
    switch (rsvpStatus) {
      case 'going':
        return 'mobile-btn-primary';
      case 'interested':
        return 'mobile-btn-secondary';
      case 'cant_go':
        return 'mobile-btn-secondary opacity-50';
      default:
        return 'mobile-btn-primary';
    }
  };

  const handleRSVP = (e) => {
    e.stopPropagation();
    if (onRSVP) onRSVP(event.id, rsvpStatus);
  };

  const handleOpen = () => {
    if (onOpen) onOpen(event);
  };

  return (
    <div 
      className="event-card card-interactive animate-fade-in"
      onClick={handleOpen}
    >
      <div className="minimal-flex">
        <div 
          className="w-12 h-12 rounded-lg minimal-flex-center mr-3 flex-shrink-0"
          style={{ backgroundColor: getEventTypeColor(event.event_type) + '20' }}
        >
          <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="minimal-flex justify-between items-start mb-2">
            <h3 className="mobile-subheading truncate">{event.title}</h3>
            <span 
              className="px-2 py-1 rounded text-xs font-medium capitalize"
              style={{ 
                backgroundColor: getEventTypeColor(event.event_type) + '20',
                color: getEventTypeColor(event.event_type)
              }}
            >
              {event.event_type}
            </span>
          </div>
          
          <p className="mobile-text-sm text-gray-300 mb-3 line-clamp-2">
            {event.description}
          </p>
          
          <div className="space-y-1">
            <div className="minimal-flex mobile-text-xs text-gray-400">
              <Clock className="minimal-icon mr-2" />
              <span>{formatEventDate(event.event_date)} at {formatEventTime(event.event_date)}</span>
            </div>
            
            {event.location && (
              <div className="minimal-flex mobile-text-xs text-gray-400">
                <MapPin className="minimal-icon mr-2" />
                <span>{event.location}</span>
              </div>
            )}
            
            {(rsvpCount > 0 || maxParticipants) && (
              <div className="minimal-flex mobile-text-xs text-gray-400">
                <Users className="minimal-icon mr-2" />
                <span>
                  {rsvpCount > 0 && `${rsvpCount} going`}
                  {rsvpCount > 0 && maxParticipants && ' • '}
                  {maxParticipants && `Max ${maxParticipants}`}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <ChevronRight className="minimal-icon text-gray-400" />
          <button
            onClick={handleRSVP}
            className={`${getRSVPButtonClass()} text-xs`}
          >
            {getRSVPButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
