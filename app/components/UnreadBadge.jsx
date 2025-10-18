'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function UnreadBadge({ userId, conversationId = null }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    loadUnreadCount();
    setupRealtimeSubscription();
  }, [userId, conversationId]);

  const loadUnreadCount = async () => {
    try {
      if (conversationId) {
        // Get unread count for specific conversation
        const { data: participant } = await supabase
          .from('conversation_participants')
          .select('last_read_at')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .single();

        if (!participant?.last_read_at) {
          setUnreadCount(0);
          return;
        }

        const { count } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .gt('created_at', participant.last_read_at)
          .neq('sender_id', userId);

        setUnreadCount(count || 0);
      } else {
        // Get total unread count across all conversations
        const { data: conversations } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            last_read_at,
            conversations!conversation_id (
              id,
              direct_messages!conversation_id (
                id,
                created_at,
                sender_id
              )
            )
          `)
          .eq('user_id', userId);

        if (!conversations) {
          setUnreadCount(0);
          return;
        }

        let totalUnread = 0;
        for (const participant of conversations) {
          const lastReadAt = participant.last_read_at;
          const messages = participant.conversations?.direct_messages || [];
          
          const unreadInConversation = messages.filter(msg => 
            msg.created_at > lastReadAt && msg.sender_id !== userId
          ).length;
          
          totalUnread += unreadInConversation;
        }

        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('unread_count')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages' 
        },
        () => {
          loadUnreadCount(); // Refresh unread count when new message arrives
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants'
        },
        () => {
          loadUnreadCount(); // Refresh when last_read_at is updated
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  if (unreadCount === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
}


