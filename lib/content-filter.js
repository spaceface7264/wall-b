/**
 * Content Filtering Library
 * Functions for filtering profanity and blocked words
 */

import { supabase } from './supabase';

// Basic profanity word list (can be expanded or loaded from database)
const DEFAULT_BLOCKED_WORDS = [
  // Common profanity (basic list - can be expanded)
  // Note: This is a minimal list. Full list should be loaded from database.
];

/**
 * Normalize text for filtering (remove special characters, convert to lowercase)
 * @param {string} text - Text to normalize
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check for leetspeak patterns (e.g., @ss, h3ll, etc.)
 * @param {string} text - Text to check
 * @param {string} word - Word to check for
 * @returns {boolean}
 */
function checkLeetspeak(text, word) {
  const normalizedText = normalizeText(text);
  const normalizedWord = normalizeText(word);
  
  // Simple leetspeak detection - replace common substitutions
  const leetMap = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    '!': 'i',
    '$': 's',
    '#': 'h'
  };
  
  let leetText = normalizedText;
  for (const [leet, normal] of Object.entries(leetMap)) {
    leetText = leetText.replace(new RegExp(leet, 'g'), normal);
  }
  
  return leetText.includes(normalizedWord);
}

/**
 * Load blocked words from database
 * @returns {Promise<Array>} Array of blocked words with severity
 */
export async function loadBlockedWords() {
  try {
    const { data, error } = await supabase
      .from('blocked_words')
      .select('word, severity')
      .order('word');

    if (error) {
      console.error('Error loading blocked words:', error);
      return DEFAULT_BLOCKED_WORDS.map(word => ({ word, severity: 'block' }));
    }

    return data || [];
  } catch (error) {
    console.error('Error loading blocked words:', error);
    return DEFAULT_BLOCKED_WORDS.map(word => ({ word, severity: 'block' }));
  }
}

/**
 * Check if content contains blocked words
 * @param {string} content - Content to check
 * @param {Array} blockedWords - Array of blocked words (optional, will load from DB if not provided)
 * @returns {Promise<{hasBlockedWords: boolean, matches: Array, action: string}>}
 */
export async function checkBlockedWords(content, blockedWords = null) {
  if (!content || typeof content !== 'string') {
    return { hasBlockedWords: false, matches: [], action: 'allow' };
  }

  // Load blocked words if not provided
  if (!blockedWords) {
    blockedWords = await loadBlockedWords();
  }

  const normalizedContent = normalizeText(content);
  const matches = [];
  let highestSeverity = 'allow';

  // Check each blocked word
  for (const { word, severity } of blockedWords) {
    const normalizedWord = normalizeText(word);
    
    // Check for exact match
    if (normalizedContent.includes(normalizedWord)) {
      matches.push({ word, severity, type: 'exact' });
      if (severity === 'block') highestSeverity = 'block';
      else if (severity === 'auto-flag' && highestSeverity !== 'block') highestSeverity = 'flag';
      else if (severity === 'warning' && highestSeverity === 'allow') highestSeverity = 'warning';
    }
    // Check for leetspeak
    else if (checkLeetspeak(content, word)) {
      matches.push({ word, severity, type: 'leetspeak' });
      if (severity === 'block') highestSeverity = 'block';
      else if (severity === 'auto-flag' && highestSeverity !== 'block') highestSeverity = 'flag';
      else if (severity === 'warning' && highestSeverity === 'allow') highestSeverity = 'warning';
    }
  }

  return {
    hasBlockedWords: matches.length > 0,
    matches,
    action: highestSeverity
  };
}

/**
 * Filter content and replace blocked words
 * @param {string} content - Content to filter
 * @param {string} replacement - Replacement character (default: '*')
 * @returns {Promise<{filtered: string, hasBlockedWords: boolean, matches: Array}>}
 */
export async function filterContent(content, replacement = '*') {
  if (!content || typeof content !== 'string') {
    return { filtered: content, hasBlockedWords: false, matches: [] };
  }

  const { matches, hasBlockedWords } = await checkBlockedWords(content);

  if (!hasBlockedWords) {
    return { filtered: content, hasBlockedWords: false, matches: [] };
  }

  let filtered = content;
  const normalizedContent = normalizeText(content);

  // Replace blocked words with asterisks
  for (const { word } of matches) {
    const normalizedWord = normalizeText(word);
    const regex = new RegExp(normalizedWord, 'gi');
    filtered = filtered.replace(regex, replacement.repeat(word.length));
  }

  return { filtered, hasBlockedWords, matches };
}

/**
 * Log filtered content to database
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content ('post', 'comment', 'message', 'community')
 * @param {string} filterApplied - Which filter/word was matched
 * @param {string} actionTaken - Action taken ('blocked', 'flagged', 'warned', 'allowed')
 * @param {string} userId - ID of the user who created the content
 * @returns {Promise<void>}
 */
export async function logFilteredContent(contentId, contentType, filterApplied, actionTaken, userId = null) {
  try {
    const { error } = await supabase
      .from('filtered_content_log')
      .insert({
        content_id: contentId,
        content_type: contentType,
        filter_applied: filterApplied,
        action_taken: actionTaken,
        user_id: userId
      });

    if (error) {
      console.error('Error logging filtered content:', error);
    }
  } catch (error) {
    console.error('Error logging filtered content:', error);
  }
}

/**
 * Validate content before submission
 * @param {string} content - Content to validate
 * @param {string} contentType - Type of content ('post', 'comment', 'message')
 * @returns {Promise<{valid: boolean, error?: string, matches?: Array, action?: string}>}
 */
export async function validateContent(content, contentType = 'post') {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  // Blocked words checking is disabled
  // Content validation now only checks for basic requirements

  return { valid: true };
}

/**
 * Get highlighted content with blocked words marked
 * @param {string} content - Content to highlight
 * @param {Array} matches - Array of matched words
 * @returns {string} HTML string with highlighted words
 */
export function highlightBlockedWords(content, matches) {
  if (!matches || matches.length === 0) return content;

  let highlighted = content;
  const normalizedContent = normalizeText(content);

  for (const { word } of matches) {
    const normalizedWord = normalizeText(word);
    const regex = new RegExp(`(${normalizedWord})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="blocked-word">$1</mark>');
  }

  return highlighted;
}
