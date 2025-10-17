'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';

export default function CalendarView({ communityId, userId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [rsvps, setRsvps] = useState(new Map());

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
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('community_id', communityId)
        .order('event_date', { ascending: true });

      if (error && Object.keys(error).length > 0) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
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
    const startingDayOfWeek = firstDay.getDay();
    
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

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
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
            
            <h2 className="text-xl font-semibold text-white">
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
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : isSelected(date)
                              ? 'bg-indigo-600 text-white'
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
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
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
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No events scheduled</p>
            </div>
          ) : (
            events.map(event => (
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
                        Created by {event.profiles?.full_name || 'Unknown'}
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
                    <button className="p-1 text-gray-400 hover:text-indigo-400 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
