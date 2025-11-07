

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import EventRSVPList from './EventRSVPList';
import { EmptyEvents, EmptySearch } from './EmptyState';
import CalendarSkeleton from './CalendarSkeleton';

export default function CalendarView({ communityId, userId, searchTerm = '', isMember = false, onCreateClick }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [rsvps, setRsvps] = useState(new Map());
  const [showRSVPList, setShowRSVPList] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    if (communityId) {
      loadEvents();
      if (userId) {
        loadRSVPs();
      }
    }
  }, [communityId, userId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading events for community:', communityId);
      
      // First, let's test if the events table exists and is accessible
      const { data: testData, error: testError } = await supabase
        .from('events')
        .select('id, title, event_date')
        .limit(1);
      
      if (testError) {
        console.error('❌ Events table test failed:', testError);
        console.error('❌ Test error details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        setEvents([]);
        return;
      }
      
      console.log('✅ Events table accessible, test data:', testData);
      
      // Now try the full query - simplified without profile join for now
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('community_id', communityId)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('❌ Error loading events:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setEvents([]);
        return;
      }

      console.log('✅ Events loaded successfully:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('❌ Exception in loadEvents:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRSVPs = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('event_id, status')
        .eq('user_id', userId);

      if (error && Object.keys(error).length > 0) {
        console.error('Error loading RSVPs:', error);
        return;
      }

      const rsvpMap = new Map();
      data?.forEach(rsvp => {
        rsvpMap.set(rsvp.event_id, rsvp.status);
      });
      setRsvps(rsvpMap);
    } catch (error) {
      console.error('Error loading RSVPs:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust for Monday as first day (0=Sunday, 1=Monday, etc.)
    // Convert Sunday (0) to 6, Monday (1) to 0, Tuesday (2) to 1, etc.
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getFilteredEvents = () => {
    if (!searchTerm.trim()) return events;
    
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return getFilteredEvents().filter(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRSVPStatus = (eventId) => {
    return rsvps.get(eventId) || null;
  };

  const getRSVPColor = (status) => {
    switch (status) {
      case 'going':
        return 'text-green-400 bg-green-500/20';
      case 'interested':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'cant_go':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const handleViewRSVPs = (eventId) => {
    setSelectedEventId(eventId);
    setShowRSVPList(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Events Calendar</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'month'
                ? 'bg-[#2663EB] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-[#2663EB] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-800 rounded-lg p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      relative p-2 h-12 text-sm rounded transition-colors
                      ${date
                        ? `hover:bg-gray-700 ${
                            isToday(date)
                              ? 'bg-[#2663EB]/20 text-[#2663EB]'
                              : isSelected(date)
                              ? 'bg-[#2663EB] text-white'
                              : 'text-gray-300'
                          }`
                        : 'cursor-default'
                      }
                    `}
                  >
                    {date && (
                      <>
                        <span className="block">{date.getDate()}</span>
                        {hasEvents && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-1.5 h-1.5 bg-[#2663EB] rounded-full"></div>
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Events for {selectedDate.toLocaleDateString()}
              </h3>
              {getEventsForSelectedDate().length === 0 ? (
                <p className="text-gray-400">No events on this date</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForSelectedDate().map(event => (
                    <div key={event.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(event.event_date)}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRSVPStatus(event.id) && (
                            <span className={`px-2 py-1 text-xs rounded ${getRSVPColor(getRSVPStatus(event.id))}`}>
                              {getRSVPStatus(event.id)}
                            </span>
                          )}
                          <button 
                            onClick={() => handleViewRSVPs(event.id)}
                            className="p-1 text-gray-400 hover:text-[#2663EB] transition-colors"
                            title="View RSVPs"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="space-y-3">
          {getFilteredEvents().length === 0 ? (
            searchTerm.trim() ? (
              <EmptySearch
                searchTerm={searchTerm}
                onClearSearch={() => {/* Search cleared by parent */}}
              />
            ) : (
              <EmptyEvents
                onCreateClick={onCreateClick}
                isMember={isMember}
              />
            )
          ) : (
            getFilteredEvents().map(event => (
              <div key={event.id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{event.title}</h4>
                    <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.event_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.max_participants ? `${event.max_participants} max` : 'Unlimited'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        Created by {event.profiles?.full_name || 'Community Member'}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRSVPStatus(event.id) && (
                      <span className={`px-2 py-1 text-xs rounded ${getRSVPColor(getRSVPStatus(event.id))}`}>
                        {getRSVPStatus(event.id)}
                      </span>
                    )}
                    <button 
                      onClick={() => handleViewRSVPs(event.id)}
                      className="p-1 text-gray-400 hover:text-[#2663EB] transition-colors"
                      title="View RSVPs"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* RSVP List Modal */}
      <EventRSVPList
        eventId={selectedEventId}
        isOpen={showRSVPList}
        onClose={() => {
          setShowRSVPList(false);
          setSelectedEventId(null);
        }}
      />
    </div>
  );
}
