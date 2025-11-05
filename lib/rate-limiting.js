/**
 * Rate Limiting Library
 * Functions for enforcing rate limits on user actions
 */

import { supabase } from './supabase';
import { checkRateLimit as checkRateLimitDB } from './auto-moderation';

// Default rate limits by action type
const DEFAULT_RATE_LIMITS = {
  post: { limit: 10, windowMinutes: 60 }, // 10 posts per hour
  comment: { limit: 30, windowMinutes: 60 }, // 30 comments per hour
  message: { limit: 50, windowMinutes: 60 }, // 50 messages per hour
  report: { limit: 5, windowMinutes: 60 }, // 5 reports per hour
  like: { limit: 100, windowMinutes: 60 }, // 100 likes per hour
};

/**
 * Check rate limit for a user action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action ('post', 'comment', 'message', etc.)
 * @param {object} options - Optional overrides { limit, windowMinutes }
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date, error?: string}>}
 */
export async function checkRateLimit(userId, actionType, options = {}) {
  if (!userId) {
    return { allowed: false, remaining: 0, resetAt: new Date(), error: 'User ID required' };
  }

  const limits = DEFAULT_RATE_LIMITS[actionType] || { limit: 10, windowMinutes: 60 };
  const limit = options.limit || limits.limit;
  const windowMinutes = options.windowMinutes || limits.windowMinutes;

  return await checkRateLimitDB(userId, actionType, limit, windowMinutes);
}

/**
 * Check if user can perform action based on rate limit
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @param {object} options - Optional overrides
 * @returns {Promise<boolean>}
 */
export async function canPerformAction(userId, actionType, options = {}) {
  const result = await checkRateLimit(userId, actionType, options);
  return result.allowed;
}

/**
 * Get rate limit info for a user action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @returns {Promise<{limit: number, remaining: number, resetAt: Date}>}
 */
export async function getRateLimitInfo(userId, actionType) {
  const limits = DEFAULT_RATE_LIMITS[actionType] || { limit: 10, windowMinutes: 60 };
  const result = await checkRateLimit(userId, actionType);
  
  return {
    limit: limits.limit,
    remaining: result.remaining,
    resetAt: result.resetAt
  };
}

/**
 * Cleanup expired rate limits (should be called periodically)
 * @returns {Promise<number>} Number of expired limits cleaned up
 */
export async function cleanupExpiredRateLimits() {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_rate_limits');

    if (error) {
      console.error('Error cleaning up rate limits:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    return 0;
  }
}
