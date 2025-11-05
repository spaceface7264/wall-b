/**
 * Reputation System
 * Functions for managing user reputation scores
 */

import { supabase } from './supabase';

/**
 * Update user reputation
 * @param {string} userId - User ID
 * @param {number} changeAmount - Amount to change (positive or negative)
 * @param {string} reason - Reason for the change
 * @param {string} sourceId - Optional source ID (e.g., post ID, comment ID)
 * @param {string} sourceType - Optional source type ('post', 'comment', 'report', etc.)
 * @param {string} createdBy - Optional user ID who caused the change
 * @returns {Promise<{success: boolean, error?: string, newScore?: number}>}
 */
export async function updateReputation(userId, changeAmount, reason, sourceId = null, sourceType = null, createdBy = null) {
  try {
    const { error } = await supabase.rpc('update_reputation', {
      target_user_id: userId,
      change_amount: changeAmount,
      reason_text: reason,
      source_id_val: sourceId,
      source_type_val: sourceType,
      created_by_val: createdBy
    });

    if (error) throw error;

    // Get updated reputation score
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('reputation_score, trust_level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error getting updated reputation:', profileError);
      return { success: true, newScore: null };
    }

    return {
      success: true,
      newScore: profile.reputation_score,
      trustLevel: profile.trust_level
    };
  } catch (error) {
    console.error('Error updating reputation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get reputation history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>}
 */
export async function getReputationHistory(userId, limit = 50) {
  try {
    const { data, error } = await supabase.rpc('get_reputation_history', {
      target_user_id: userId,
      limit_count: limit
    });

    if (error) {
      console.error('Error getting reputation history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting reputation history:', error);
    return [];
  }
}

/**
 * Get user reputation score
 * @param {string} userId - User ID
 * @returns {Promise<{score: number, trustLevel: string}>}
 */
export async function getReputation(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reputation_score, trust_level')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting reputation:', error);
      return { score: 100, trustLevel: 'new' };
    }

    return {
      score: profile.reputation_score || 100,
      trustLevel: profile.trust_level || 'new'
    };
  } catch (error) {
    console.error('Error getting reputation:', error);
    return { score: 100, trustLevel: 'new' };
  }
}

/**
 * Award reputation for positive actions
 * @param {string} userId - User ID
 * @param {number} amount - Amount to award (default: 5)
 * @param {string} reason - Reason for award
 * @param {string} sourceId - Optional source ID
 * @param {string} sourceType - Optional source type
 * @returns {Promise<{success: boolean}>}
 */
export async function awardReputation(userId, amount = 5, reason = 'Positive action', sourceId = null, sourceType = null) {
  return updateReputation(userId, amount, reason, sourceId, sourceType);
}

/**
 * Penalize reputation for negative actions
 * @param {string} userId - User ID
 * @param {number} amount - Amount to penalize (default: -10)
 * @param {string} reason - Reason for penalty
 * @param {string} sourceId - Optional source ID
 * @param {string} sourceType - Optional source type
 * @returns {Promise<{success: boolean}>}
 */
export async function penalizeReputation(userId, amount = -10, reason = 'Negative action', sourceId = null, sourceType = null) {
  return updateReputation(userId, amount, reason, sourceId, sourceType);
}
