

import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronDown, ChevronUp, User } from 'lucide-react';

export default function SimpleEventCard({ event, onRSVP, rsvpStatus = null }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
      training: '#087E8B',
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
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'interested':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'cant_go':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-[#087E8B] hover:bg-[#066a75] text-white';
    }
  };

  const handleRSVP = (e) => {
    e.stopPropagation();
    if (onRSVP) onRSVP(event.id, rsvpStatus);
  };

  return (
    <div className="mobile-card cursor-pointer hover:border-[#087E8B]/50 transition-all duration-200">
      {/* Header - Always Visible */}
      <div 
        className="flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Event Type Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: getEventTypeColor(event.event_type) + '20' }}
          >
            <span className="text-lg">{getEventTypeIcon(event.event_type)}</span>
          </div>
          
          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h3 className="mobile-subheading truncate">{event.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{formatEventDate(event.event_date)} at {formatEventTime(event.event_date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expand/Collapse Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRSVP}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${getRSVPButtonClass()}`}
          >
            {getRSVPButtonText()}
          </button>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="space-y-3">
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
            </div>
            
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="text-gray-400" size={16} />
                <span className="text-gray-300">Type:</span>
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
              
              {event.max_participants && (
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="text-gray-400" size={16} />
                  <span className="text-gray-300">Max Participants:</span>
                  <span className="text-gray-400">{event.max_participants}</span>
                </div>
              )}
              
              {event.created_by && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="text-gray-400" size={16} />
                  <span className="text-gray-300">Created by:</span>
                  <span className="text-gray-400">{event.user_name || 'Unknown'}</span>
                </div>
              )}
            </div>
            
            {/* Full Date/Time */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="text-[#087E8B]" size={16} />
                <span className="text-gray-300">Full Details:</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(event.event_date).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
