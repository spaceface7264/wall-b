/**
 * User Blocking and Muting Utilities
 * Functions for managing user blocks and mutes
 */

import { supabase } from './supabase';

/**
 * Block a user
 * @param {string} blockedUserId - ID of the user to block
 * @param {string} reason - Optional reason for blocking
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function blockUser(blockedUserId, reason = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (user.id === blockedUserId) {
      return { success: false, error: 'Cannot block yourself' };
    }

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
        reason: reason || null
      });

    if (error) {
      // If user is already blocked, that's fine
      if (error.code === '23505') { // Unique constraint violation
        return { success: true, message: 'User already blocked' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unblock a user
 * @param {string} blockedUserId - ID of the user to unblock
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unblockUser(blockedUserId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mute a user (temporary hide their content)
 * @param {string} mutedUserId - ID of the user to mute
 * @param {Date} expiresAt - Optional expiration date (null = permanent until manually removed)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function muteUser(mutedUserId, expiresAt = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (user.id === mutedUserId) {
      return { success: false, error: 'Cannot mute yourself' };
    }

    const muteData = {
      muter_id: user.id,
      muted_id: mutedUserId
    };

    if (expiresAt) {
      muteData.expires_at = expiresAt.toISOString();
    }

    const { error } = await supabase
      .from('user_mutes')
      .insert(muteData);

    if (error) {
      // If user is already muted, that's fine
      if (error.code === '23505') { // Unique constraint violation
        return { success: true, message: 'User already muted' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error muting user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unmute a user
 * @param {string} mutedUserId - ID of the user to unmute
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unmuteUser(mutedUserId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_mutes')
      .delete()
      .eq('muter_id', user.id)
      .eq('muted_id', mutedUserId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unmuting user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a user is blocked by the current user
 * @param {string} userId - ID of the user to check
 * @returns {Promise<boolean>}
 */
export async function isUserBlocked(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !userId) return false;

    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user is blocked:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
}

/**
 * Check if a user is muted by the current user
 * @param {string} userId - ID of the user to check
 * @returns {Promise<boolean>}
 */
export async function isUserMuted(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !userId) return false;

    const { data, error } = await supabase
      .from('user_mutes')
      .select('id, expires_at')
      .eq('muter_id', user.id)
      .eq('muted_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user is muted:', error);
      return false;
    }

    if (!data) return false;

    // Check if mute has expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // Mute has expired, remove it
        await unmuteUser(userId);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking if user is muted:', error);
    return false;
  }
}

/**
 * Get all users blocked by the current user
 * @returns {Promise<Array>}
 */
export async function getBlockedUsers() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch blocks first
    const { data: blocksData, error: blocksError } = await supabase
      .from('user_blocks')
      .select('id, blocked_id, reason, created_at')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (blocksError) {
      console.error('Error fetching user_blocks:', blocksError);
      throw blocksError;
    }

    if (!blocksData || blocksData.length === 0) {
      console.log('No blocked users found');
      return [];
    }

    // Fetch profiles separately
    const blockedIds = blocksData.map(b => b.blocked_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nickname, full_name, avatar_url')
      .in('id', blockedIds);

    if (profilesError) {
      console.error('Error fetching profiles for blocked users:', profilesError);
      // Continue even if profiles fail - we'll show user IDs as fallback
    }

    // Combine the data
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
    const combined = blocksData.map(block => ({
      ...block,
      profiles: profilesMap.get(block.blocked_id) || null
    }));

    console.log('getBlockedUsers returning:', combined);
    return combined;
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}

/**
 * Get all users muted by the current user
 * @returns {Promise<Array>}
 */
export async function getMutedUsers() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch mutes first
    const { data: mutesData, error: mutesError } = await supabase
      .from('user_mutes')
      .select('id, muted_id, created_at, expires_at')
      .eq('muter_id', user.id)
      .order('created_at', { ascending: false });

    if (mutesError) {
      console.error('Error fetching user_mutes:', mutesError);
      throw mutesError;
    }

    if (!mutesData || mutesData.length === 0) {
      console.log('No muted users found');
      return [];
    }

    // Filter out expired mutes first
    const now = new Date();
    const activeMutes = mutesData.filter(mute => {
      if (!mute.expires_at) return true;
      return new Date(mute.expires_at) > now;
    });

    if (activeMutes.length === 0) return [];

    // Fetch profiles separately
    const mutedIds = activeMutes.map(m => m.muted_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nickname, full_name, avatar_url')
      .in('id', mutedIds);

    if (profilesError) {
      console.error('Error fetching profiles for muted users:', profilesError);
      // Continue even if profiles fail - we'll show user IDs as fallback
    }

    // Combine the data
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
    const combined = activeMutes.map(mute => ({
      ...mute,
      profiles: profilesMap.get(mute.muted_id) || null
    }));

    console.log('getMutedUsers returning:', combined);
    return combined;
  } catch (error) {
    console.error('Error getting muted users:', error);
    return [];
  }
}

/**
 * Check if current user is blocked by another user
 * @param {string} userId - ID of the user to check
 * @returns {Promise<boolean>}
 */
export async function isBlockedByUser(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !userId) return false;

    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if blocked by user:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if blocked by user:', error);
    return false;
  }
}

/**
 * Filter out blocked/muted users from an array of user IDs
 * @param {Array<string>} userIds - Array of user IDs to filter
 * @returns {Promise<Array<string>>} - Filtered array of user IDs
 */
export async function filterBlockedUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return userIds;

    // Get all blocked and muted users
    const [blockedResult, mutedResult] = await Promise.all([
      supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id),
      supabase
        .from('user_mutes')
        .select('muted_id')
        .eq('muter_id', user.id)
    ]);

    const blockedIds = new Set((blockedResult.data || []).map(b => b.blocked_id));
    const mutedIds = new Set((mutedResult.data || []).map(m => m.muted_id));

    return userIds.filter(id => !blockedIds.has(id) && !mutedIds.has(id));
  } catch (error) {
    console.error('Error filtering blocked users:', error);
    return userIds; // Return original array on error
  }
}
