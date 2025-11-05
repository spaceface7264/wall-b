/**
 * Suspension System Utilities
 * Functions for managing user suspensions
 */

import { supabase } from './supabase';

/**
 * Suspend a user
 * @param {string} userId - ID of the user to suspend
 * @param {string} reason - Reason for suspension
 * @param {Date} expiresAt - Optional expiration date (null = permanent)
 * @param {string} notes - Optional notes
 * @returns {Promise<{success: boolean, error?: string, suspensionId?: string}>}
 */
export async function suspendUser(userId, reason, expiresAt = null, notes = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: 'Only admins can suspend users' };
    }

    const suspensionData = {
      user_id: userId,
      reason: reason,
      suspended_by: user.id,
      is_active: true
    };

    if (expiresAt) {
      suspensionData.expires_at = expiresAt.toISOString();
    }

    if (notes) {
      suspensionData.notes = notes;
    }

    const { data, error } = await supabase
      .from('user_suspensions')
      .insert(suspensionData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, suspensionId: data.id };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a user is currently suspended
 * @param {string} userId - User ID to check
 * @returns {Promise<{suspended: boolean, suspension?: object}>}
 */
export async function checkSuspensionStatus(userId) {
  try {
    if (!userId) return { suspended: false };

    // First, expire any old suspensions
    await supabase.rpc('expire_suspensions');

    // Check for active suspensions
    const { data, error } = await supabase
      .from('user_suspensions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('suspended_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking suspension status:', error);
      return { suspended: false };
    }

    if (!data) {
      return { suspended: false };
    }

    // Check if suspension has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Expire it
      await supabase
        .from('user_suspensions')
        .update({ is_active: false })
        .eq('id', data.id);

      return { suspended: false };
    }

    return { suspended: true, suspension: data };
  } catch (error) {
    console.error('Error checking suspension status:', error);
    return { suspended: false };
  }
}

/**
 * Unsuspend a user (remove active suspension)
 * @param {string} userId - ID of the user to unsuspend
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unsuspendUser(userId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return { success: false, error: 'Only admins can unsuspend users' };
    }

    const { error } = await supabase
      .from('user_suspensions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unsuspending user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get suspension history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getSuspensionHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('user_suspensions')
      .select(`
        *,
        suspended_by_profile:profiles!user_suspensions_suspended_by_fkey (
          id,
          nickname,
          full_name
        )
      `)
      .eq('user_id', userId)
      .order('suspended_at', { ascending: false });

    if (error) {
      console.error('Error getting suspension history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting suspension history:', error);
    return [];
  }
}

/**
 * Auto-expire suspensions (should be called periodically)
 * @returns {Promise<number>} Number of suspensions expired
 */
export async function autoExpireSuspensions() {
  try {
    const { data, error } = await supabase.rpc('expire_suspensions');

    if (error) {
      console.error('Error expiring suspensions:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error expiring suspensions:', error);
    return 0;
  }
}
