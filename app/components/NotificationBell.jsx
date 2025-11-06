import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, X as XIcon } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import { useToast } from '../providers/ToastProvider';

export default function NotificationBell({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications
  } = useNotifications(userId);



  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      comment_reply: '💬',
      post_like: '❤️',
      comment_like: '👍',
      event_invite: '📅',
      event_reminder: '⏰',
      mention: '👤',
      direct_message: '💌',
      community_join: '👥',
      community_invite: '✉️',
      event_rsvp: '✅',
      post_comment: '💭',
      system: '🔔'
    };
    return icons[type] || '🔔';
  };

  // Get notification color
  const getNotificationColor = (type) => {
    const colors = {
      comment_reply: 'text-blue-400',
      post_like: 'text-red-400',
      comment_like: 'text-yellow-400',
      event_invite: 'text-green-400',
      event_reminder: 'text-orange-400',
      mention: 'text-[#087E8B]',
      direct_message: 'text-pink-400',
      community_join: 'text-cyan-400',
      community_invite: 'text-purple-400',
      event_rsvp: 'text-emerald-400',
      post_comment: 'text-[#087E8B]',
      system: 'text-gray-400'
    };
    return colors[type] || 'text-gray-400';
  };

  // Get actor name from notification
  const getActorName = (notification) => {
    if (notification.actor_profile) {
      return notification.actor_profile.nickname || notification.actor_profile.full_name || 'Someone';
    }
    // Fallback: try to extract from message
    const message = notification.message || '';
    const match = message.match(/^([^ ]+)/);
    return match ? match[1] : 'Someone';
  };

  // Get event snippet
  const getEventSnippet = (notification) => {
    if (!notification.event) return null;
    
    const event = notification.event;
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    
    const parts = [];
    
    if (eventDate) {
      const now = new Date();
      const diffDays = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        parts.push('Past event');
      } else if (diffDays === 0) {
        parts.push('Today ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } else if (diffDays === 1) {
        parts.push('Tomorrow ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } else if (diffDays < 7) {
        parts.push(eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      } else {
        parts.push(eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }
    
    if (event.location) {
      parts.push(event.location);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // Handle accepting community invite
  const handleAcceptInvite = async (notification, e) => {
    e.stopPropagation();
    if (processingInvite) return;

    const data = notification.data || {};
    const communityId = data.community_id;

    if (!communityId || !userId) return;

    setProcessingInvite(notification.id);
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        showToast('info', 'Already a Member', 'You are already a member of this community');
        markAsRead(notification.id);
        refreshNotifications();
        return;
      }

      // Join the community
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId
        });

      if (error) {
        console.error('Error accepting invite:', error);
        showToast('error', 'Error', 'Failed to join community');
        return;
      }

      showToast('success', 'Joined!', `You've joined ${data.community_name || 'the community'}`);
      markAsRead(notification.id);
      refreshNotifications();
      
      // Navigate to the community
      navigate(`/community/${communityId}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error accepting invite:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setProcessingInvite(null);
    }
  };

  // Handle declining community invite
  const handleDeclineInvite = async (notification, e) => {
    e.stopPropagation();
    if (processingInvite) return;

    setProcessingInvite(notification.id);
    try {
      markAsRead(notification.id);
      refreshNotifications();
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setProcessingInvite(null);
    }
  };

  // Handle notification click with navigation
  const handleNotificationClick = (notification) => {
    // Don't navigate if it's a community invite (user should use buttons)
    if (notification.type === 'community_invite') {
      return;
    }

    markAsRead(notification.id);
    
    // Navigate based on notification type and data
    const data = notification.data || {};
    
    if (data.event_id && notification.event) {
      // Navigate to event detail page
      navigate(`/community/${data.community_id || ''}/events`);
    } else if (data.post_id) {
      // Navigate to post detail page
      if (data.community_id) {
        navigate(`/community/${data.community_id}/post/${data.post_id}`);
      }
    } else if (data.community_id && notification.type === 'community_join') {
      // Navigate to community
      navigate(`/community/${data.community_id}`);
    }
    
    setIsOpen(false);
  };

  // The useNotifications hook handles loading automatically

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-touch-target p-2 relative"
        aria-label="Notifications"
      >
        <Bell className="minimal-icon" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-700 rounded shadow-xl" style={{ borderRadius: 4 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <h3 className="text-sm font-medium text-white" style={{ fontSize: '13px' }}>Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-gray-400 hover:text-white transition-colors"
                    style={{ fontSize: '11px' }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-400" style={{ fontSize: '11px' }}>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-3 text-center text-gray-400" style={{ fontSize: '11px' }}>
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-3 py-2 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-500/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`} style={{ fontSize: '14px' }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white truncate" style={{ fontSize: '11px', fontWeight: 500 }}>
                                {notification.title}
                              </h4>
                              
                              {/* Show actor name and event snippet for event notifications */}
                              {(['event_rsvp', 'event_invite', 'event_reminder'].includes(notification.type)) && notification.event ? (
                                <>
                                  <div className="mt-0.5">
                                    <span className="text-[#087E8B]" style={{ fontSize: '11px' }}>
                                      {getActorName(notification)}
                                    </span>
                                    <span className="text-gray-400 ml-1" style={{ fontSize: '11px' }}>
                                      {notification.type === 'event_rsvp' ? 'RSVPed' : notification.type === 'event_invite' ? 'invited you to' : 'reminder for'}
                                    </span>
                                  </div>
                                  <div className="mt-1 p-1.5 bg-gray-800/50 rounded border border-gray-700/50" style={{ borderRadius: 4 }}>
                                    <p className="text-white line-clamp-1" style={{ fontSize: '11px', fontWeight: 500 }}>
                                      {notification.event.title || 'Untitled Event'}
                                    </p>
                                    {getEventSnippet(notification) && (
                                      <p className="text-gray-400 mt-0.5 line-clamp-1" style={{ fontSize: '10px' }}>
                                        {getEventSnippet(notification)}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : notification.type === 'community_invite' ? (
                                <>
                                  <div className="mt-0.5">
                                    <span className="text-[#087E8B]" style={{ fontSize: '11px' }}>
                                      {getActorName(notification)}
                                    </span>
                                    <span className="text-gray-400 ml-1" style={{ fontSize: '11px' }}>
                                      invited you to join
                                    </span>
                                  </div>
                                  <p className="text-gray-300 mt-0.5 line-clamp-2" style={{ fontSize: '11px' }}>
                                    {notification.data?.community_name || 'a community'}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={(e) => handleAcceptInvite(notification, e)}
                                      disabled={processingInvite === notification.id}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-[#087E8B] hover:bg-[#066a75] text-white rounded text-xs transition-colors disabled:opacity-50"
                                    >
                                      <Check className="w-3 h-3" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={(e) => handleDeclineInvite(notification, e)}
                                      disabled={processingInvite === notification.id}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                                    >
                                      <XIcon className="w-3 h-3" />
                                      Decline
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <p className="text-gray-300 mt-0.5 line-clamp-2" style={{ fontSize: '11px' }}>
                                  {notification.message}
                                </p>
                              )}
                              
                              {/* Show actor name for other notification types */}
                              {!['event_rsvp', 'event_invite', 'event_reminder', 'community_invite'].includes(notification.type) && notification.actor_profile && (
                                <p className="text-[#087E8B] mt-0.5" style={{ fontSize: '10px' }}>
                                  {getActorName(notification)}
                                </p>
                              )}
                            </div>
                            {!notification.is_read && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                          
                          <p className="text-gray-400 mt-1" style={{ fontSize: '10px' }}>
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700/50">
                <button className="w-full text-gray-400 hover:text-white transition-colors" style={{ fontSize: '11px' }}>
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
