
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, X, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatNotification({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    // Check notification permission
    checkNotificationPermission();
    setupNotificationListener();
  }, [userId]);

  const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    setIsEnabled(currentPermission === 'granted');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    setIsEnabled(permission === 'granted');
  };

  const setupNotificationListener = () => {
    // Listen for new messages in conversations the user is part of
    const subscription = supabase
      .channel('chat-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages'
        },
        async (payload) => {
          // Check if the message is not from the current user
          if (payload.new.sender_id !== userId) {
            // Get conversation details
            const { data: conversation } = await supabase
              .from('conversations')
              .select(`
                id,
                type,
                conversation_participants!inner (
                  user_id,
                  profiles!user_id (
                    full_name,
                    avatar_url
                  )
                )
              `)
              .eq('id', payload.new.conversation_id)
              .eq('conversation_participants.user_id', userId)
              .single();

            if (conversation) {
              const otherParticipant = conversation.conversation_participants.find(
                p => p.user_id !== userId
              );

              const notification = {
                id: payload.new.id,
                message: payload.new.message,
                sender: otherParticipant?.profiles?.full_name || 'Someone',
                conversationId: conversation.id,
                timestamp: new Date()
              };

              setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
              setShowNotification(true);

              // Show browser notification if permission is granted
              if (isEnabled && document.hidden) {
                showBrowserNotification(notification);
              }

              // Auto-hide after 5 seconds
              setTimeout(() => {
                setShowNotification(false);
              }, 5000);
            }
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const showBrowserNotification = (notification) => {
    if (!isEnabled) return;

    const browserNotification = new Notification(`${notification.sender} sent a message`, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.conversationId, // Replace notifications for same conversation
      requireInteraction: false
    });

    browserNotification.onclick = () => {
      window.focus();
      navigate(`/chat?conversationId=${notification.conversationId}`);
      browserNotification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  };

  const handleNotificationClick = (conversationId) => {
    navigate(`/chat?conversationId=${conversationId}`);
    setShowNotification(false);
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };


  // Show notification permission denied message
  if (permission === 'denied') {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <BellOff className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1">
                Notifications Disabled
              </h4>
              <p className="text-xs text-gray-400">
                Enable in browser settings to get message notifications
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showNotification || notifications.length === 0) return null;

  const latestNotification = notifications[0];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 animate-slide-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-white truncate">
                {latestNotification.sender}
              </h4>
              <button
                onClick={dismissNotification}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-300 truncate mb-2">
              {latestNotification.message}
            </p>
            
            <button
              onClick={() => handleNotificationClick(latestNotification.conversationId)}
              className="text-xs text-accent-blue hover:text-accent-blue-hover transition-colors"
            >
              View conversation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
