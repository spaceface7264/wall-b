/**
 * Auto-Moderation Utilities
 * Functions for content scanning, spam detection, and automated moderation
 */

import { supabase } from './supabase';
import { logFilteredContent } from './content-filter';
import { scanContentForNSFW } from './nsfw-detection';

/**
 * Scan content for various moderation issues
 * @param {string} content - Content to scan
 * @param {string} contentType - Type of content ('post', 'comment', 'message')
 * @returns {Promise<{issues: Array, flagged: boolean, action: string}>}
 */
export async function scanContent(content, contentType = 'post') {
  if (!content || typeof content !== 'string') {
    return { issues: [], flagged: false, action: 'allow' };
  }

  const issues = [];
  let action = 'allow';

  // Blocked words checking is disabled
  // Spam pattern detection is disabled
  
  // Check for NSFW content
  const nsfwResult = await scanContentForNSFW({ text: content });
  if (nsfwResult.isNsfw && nsfwResult.confidence > 0.7) {
    issues.push({
      type: 'nsfw',
      severity: 'medium',
      confidence: nsfwResult.confidence
    });

    if (action === 'allow') {
      action = 'flag'; // Flag for review if not already blocked
    }
  }

  return {
    issues,
    flagged: issues.length > 0,
    action
  };
}

/**
 * Check for spam patterns in content
 * @param {string} content - Content to check
 * @returns {Promise<{isSpam: boolean, severity: string, reason: string}>}
 */
export async function checkSpamPatterns(content) {
  if (!content || typeof content !== 'string') {
    return { isSpam: false, severity: 'none', reason: null };
  }

  const normalized = content.toLowerCase();
  const patterns = [];

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    patterns.push({
      type: 'excessive_links',
      severity: 'high',
      reason: `Contains ${linkCount} links (max 3 allowed)`
    });
  }

  // Check for repeated characters (e.g., "aaaaa")
  const repeatedChars = /(.)\1{4,}/g;
  if (repeatedChars.test(content)) {
    patterns.push({
      type: 'repeated_characters',
      severity: 'medium',
      reason: 'Contains excessive repeated characters'
    });
  }

  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    patterns.push({
      type: 'excessive_caps',
      severity: 'low',
      reason: 'Contains excessive capitalization'
    });
  }

  // Check for repeated words/phrases
  const words = normalized.split(/\s+/);
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const repeatedWords = Object.entries(wordCounts).filter(([word, count]) => 
    count > 5 && word.length > 3
  );
  
  if (repeatedWords.length > 0) {
    patterns.push({
      type: 'repeated_words',
      severity: 'medium',
      reason: 'Contains excessive repeated words'
    });
  }

  // Check for suspicious patterns (multiple special chars, numbers, etc.)
  const specialCharRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length;
  if (specialCharRatio > 0.3 && content.length > 10) {
    patterns.push({
      type: 'suspicious_patterns',
      severity: 'medium',
      reason: 'Contains suspicious character patterns'
    });
  }

  if (patterns.length === 0) {
    return { isSpam: false, severity: 'none', reason: null };
  }

  // Determine highest severity
  const severities = ['low', 'medium', 'high'];
  const highestSeverity = patterns.reduce((max, p) => {
    const currentIdx = severities.indexOf(p.severity);
    const maxIdx = severities.indexOf(max);
    return currentIdx > maxIdx ? p.severity : max;
  }, 'low');

  return {
    isSpam: true,
    severity: highestSeverity,
    reason: patterns.map(p => p.reason).join('; ')
  };
}

/**
 * Check rate limit for a user action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action ('post', 'comment', 'message')
 * @param {number} limit - Maximum number of actions allowed
 * @param {number} windowMinutes - Time window in minutes
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkRateLimit(userId, actionType, limit = 10, windowMinutes = 60) {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + windowMinutes);

    // Get current count for this action type in the time window
    const { data: existingLimits, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking rate limit:', fetchError);
      // On error, allow the action (fail open)
      return { allowed: true, remaining: limit, resetAt: expiresAt };
    }

    if (!existingLimits || existingLimits.length === 0) {
      // No existing limit, create new one
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          action_type: actionType,
          count: 1,
          window_start: windowStart.toISOString(),
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error creating rate limit:', insertError);
        return { allowed: true, remaining: limit - 1, resetAt: expiresAt };
      }

      return { allowed: true, remaining: limit - 1, resetAt: expiresAt };
    }

    const currentLimit = existingLimits[0];
    const currentCount = currentLimit.count || 0;

    if (currentCount >= limit) {
      // Rate limit exceeded
      const resetAt = new Date(currentLimit.expires_at);
      return { allowed: false, remaining: 0, resetAt };
    }

    // Increment count
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ count: currentCount + 1 })
      .eq('id', currentLimit.id);

    if (updateError) {
      console.error('Error updating rate limit:', updateError);
      return { allowed: true, remaining: limit - currentCount - 1, resetAt: new Date(currentLimit.expires_at) };
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetAt: new Date(currentLimit.expires_at)
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the action (fail open)
    return { allowed: true, remaining: limit, resetAt: new Date() };
  }
}

/**
 * Auto-flag content based on scan results
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content
 * @param {object} scanResult - Result from scanContent
 * @returns {Promise<{success: boolean, flagged: boolean}>}
 */
export async function autoFlagContent(contentId, contentType, scanResult) {
  if (!scanResult.flagged || scanResult.action === 'block') {
    return { success: true, flagged: false };
  }

  try {
    // Log the flagged content
    if (scanResult.issues.length > 0) {
      const primaryIssue = scanResult.issues[0];
      await logFilteredContent(
        contentId,
        contentType,
        primaryIssue.type,
        'flagged',
        null // userId will be set by the function if needed
      );
    }

    // Mark content as requiring moderation
    const tableName = contentType === 'post' ? 'posts' : 'comments';
    const { error } = await supabase
      .from(tableName)
      .update({ requires_moderation: true })
      .eq('id', contentId);

    if (error) {
      console.error('Error flagging content:', error);
      return { success: false, flagged: false };
    }

    return { success: true, flagged: true };
  } catch (error) {
    console.error('Error auto-flagging content:', error);
    return { success: false, flagged: false };
  }
}
