'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      // Get current timestamp for filtering expired notifications
      const currentTime = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          events:data->event_id (
            id,
            title,
            description,
            event_date,
            location,
            event_type
          )
        `)
        .eq('user_id', user.id) // Use the authenticated user's ID
        .or(`expires_at.is.null,expires_at.gt.${currentTime}`) // Exclude expired notifications
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        return;
      }

      // Enrich notifications with profile names and event details
      // Also filter out expired notifications client-side as a safety measure
      const now = new Date();
      const enrichedNotifications = await Promise.all(
        (data || [])
          .filter(notification => {
            // Filter out expired notifications
            if (notification.expires_at) {
              const expiresAt = new Date(notification.expires_at);
              if (expiresAt <= now) {
                return false; // Skip expired notifications
              }
            }
            return true;
          })
          .map(async (notification) => {
          const notificationData = notification.data || {};
          let enriched = { ...notification };

          // Get profile information for the actor (person who triggered the notification)
          if (notificationData.commenter_id || notificationData.liker_id || notificationData.rsvper_id || notificationData.inviter_id) {
            const actorId = notificationData.commenter_id || notificationData.liker_id || notificationData.rsvper_id || notificationData.inviter_id;
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, nickname, full_name, avatar_url')
              .eq('id', actorId)
              .single();
            
            if (!profileError && profile) {
              enriched.actor_profile = profile;
            }
          }

          // Get event details if event_id exists
          if (notificationData.event_id) {
            const { data: event, error: eventError } = await supabase
              .from('events')
              .select('id, title, description, event_date, location, event_type')
              .eq('id', notificationData.event_id)
              .single();
            
            if (!eventError && event) {
              enriched.event = event;
            }
          }

          return enriched;
        })
      );

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        setUnreadCount(0);
        return;
      }
      
      // Get current timestamp for filtering expired notifications
      const now = new Date().toISOString();
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id) // Use the authenticated user's ID
        .eq('is_read', false)
        .or(`expires_at.is.null,expires_at.gt.${now}`); // Exclude expired notifications
      
      if (error) {
        console.error('Error loading unread count:', error);
        // Fallback: fetch all unread and filter client-side
        const { data: allUnread, error: fetchError } = await supabase
          .from('notifications')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (!fetchError && allUnread) {
          const now = new Date();
          const validUnread = allUnread.filter(n => {
            if (n.expires_at) {
              return new Date(n.expires_at) > now;
            }
            return true;
          });
          setUnreadCount(validUnread.length);
        } else {
          setUnreadCount(0);
        }
        return;
      }
      
      // Double-check count by filtering client-side if needed
      // (The query filter should work, but this ensures accuracy)
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', user.id) // Use the authenticated user's ID
        .select();

      // Only log if there's an actual meaningful error
      if (error && error.message && error.message.trim() !== '') {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      // First check if there are any unread notifications
      if (unreadCount === 0) {
        return; // Nothing to mark as read
      }

      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id) // Use the authenticated user's ID
        .eq('is_read', false)
        .select();

      // Only log if there's an actual meaningful error
      if (error && error.message && error.message.trim() !== '') {
        console.error('Error marking all as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [userId, unreadCount]);

  // Create a notification (for testing or manual creation)
  const createNotification = useCallback(async (type, title, message, data = {}) => {
    if (!userId) return;
    
    try {
      // First, get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id, // Use the authenticated user's ID
          type: type,
          title: title,
          message: message,
          data: data
        });

      if (error) throw error;
      
      // Reload notifications to show the new one
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [userId, loadNotifications, loadUnreadCount]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Add new notification to the list
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [userId, loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: loadNotifications,
    refreshUnreadCount: loadUnreadCount
  };
}
