'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
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
      mention: 'text-purple-400',
      direct_message: 'text-pink-400',
      community_join: 'text-cyan-400',
      event_rsvp: 'text-emerald-400',
      post_comment: 'text-indigo-400',
      system: 'text-gray-400'
    };
    return colors[type] || 'text-gray-400';
  };

  // Handle notification click with navigation
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type and data
    const data = notification.data || {};
    
    if (data.post_id) {
      // Navigate to post detail page
      if (data.community_id) {
        router.push(`/community/${data.community_id}/post/${data.post_id}`);
      }
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
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
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
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
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
              <div className="p-4 border-t border-gray-700">
                <button className="w-full text-sm text-gray-400 hover:text-white transition-colors">
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
