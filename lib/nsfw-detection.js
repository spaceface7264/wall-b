/**
 * NSFW Detection Library
 * Functions for detecting NSFW content in text and images
 */

import { supabase } from './supabase';

// NSFW keywords for text-based detection
const NSFW_KEYWORDS = [
  // Explicit content keywords
  'nsfw', 'explicit', 'adult', 'xxx', 'porn', 'porno', 'pornography', 'nude', 'naked',
  'sex', 'sexual', 'erotic', 'erotica', 'hentai', '18+', 'xxx', 'xrated',
  'boobs', 'tits', 'ass', 'cock', 'dick', 'pussy', 'cum', 'orgasm',
  'masturbat', 'fuck', 'fucking', 'bitch', 'slut', 'whore',
  // Add more as needed
];

// Known NSFW/adult website domains and patterns
const NSFW_DOMAINS = [
  'pornhub', 'xvideos', 'xhamster', 'redtube', 'youporn', 'tube8',
  'porn', 'xxx', 'adult', 'sex', 'erotic', 'hentai',
  // Add more adult site domains
];

// NSFW URL patterns
const NSFW_URL_PATTERNS = [
  /porn/i,
  /xxx/i,
  /adult/i,
  /sex/i,
  /erotic/i,
  /hentai/i,
];

// Severity levels for NSFW detection
const NSFW_SEVERITY = {
  SAFE: 'safe',
  MILD: 'mild',
  MODERATE: 'moderate',
  EXPLICIT: 'explicit'
};

/**
 * Normalize text for NSFW detection
 * @param {string} text - Text to normalize
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract URLs from text
 * @param {string} text - Text to extract URLs from
 * @returns {Array<string>} Array of URLs
 */
function extractUrls(text) {
  if (!text) return [];
  // Match URLs (http, https, www, etc.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
  return text.match(urlRegex) || [];
}

/**
 * Check if URL/domain is NSFW
 * @param {string} url - URL to check
 * @returns {{isNsfw: boolean, confidence: number, reason: string}}
 */
function checkUrlForNSFW(url) {
  if (!url) return { isNsfw: false, confidence: 0, reason: null };
  
  const lowerUrl = url.toLowerCase();
  
  // Check against known NSFW domains
  for (const domain of NSFW_DOMAINS) {
    if (lowerUrl.includes(domain)) {
      return { isNsfw: true, confidence: 0.95, reason: `Contains NSFW domain: ${domain}` };
    }
  }
  
  // Check against URL patterns
  for (const pattern of NSFW_URL_PATTERNS) {
    if (pattern.test(url)) {
      return { isNsfw: true, confidence: 0.85, reason: 'URL matches NSFW pattern' };
    }
  }
  
  return { isNsfw: false, confidence: 0, reason: null };
}

/**
 * Detect NSFW content in text using keywords and URL checking
 * @param {string} text - Text to analyze
 * @returns {Promise<{isNsfw: boolean, confidence: number, severity: string, keywords: Array, urls: Array}>}
 */
export async function detectNSFWText(text) {
  if (!text || typeof text !== 'string') {
    return { isNsfw: false, confidence: 0, severity: NSFW_SEVERITY.SAFE, keywords: [], urls: [] };
  }

  const normalizedText = normalizeText(text);
  const foundKeywords = [];
  let matchCount = 0;

  // Check for NSFW keywords
  for (const keyword of NSFW_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      foundKeywords.push(keyword);
      matchCount++;
    }
  }

  // Extract and check URLs
  const urls = extractUrls(text);
  let urlNsfwResult = { isNsfw: false, confidence: 0, reason: null };
  if (urls.length > 0) {
    // Check each URL
    for (const url of urls) {
      const urlCheck = checkUrlForNSFW(url);
      if (urlCheck.isNsfw && urlCheck.confidence > urlNsfwResult.confidence) {
        urlNsfwResult = urlCheck;
      }
    }
  }

  // Calculate confidence based on keyword matches and URL checks
  let confidence = 0;
  if (urlNsfwResult.isNsfw) {
    // URL detection is very reliable
    confidence = urlNsfwResult.confidence;
    matchCount = Math.max(matchCount, 3); // Treat NSFW URL as multiple keyword matches
  } else {
    // Keyword-based confidence
    confidence = Math.min(matchCount / 3, 0.95);
  }

  // Determine severity
  let severity = NSFW_SEVERITY.SAFE;
  if (matchCount > 0 || urlNsfwResult.isNsfw) {
    if (urlNsfwResult.isNsfw || matchCount >= 3) severity = NSFW_SEVERITY.EXPLICIT;
    else if (matchCount === 2) severity = NSFW_SEVERITY.MODERATE;
    else severity = NSFW_SEVERITY.MILD;
  }

  const isNsfw = (matchCount > 0 && confidence > 0.3) || urlNsfwResult.isNsfw;

  return {
    isNsfw,
    confidence,
    severity,
    keywords: foundKeywords,
    urls: urlNsfwResult.isNsfw ? urls : []
  };
}

/**
 * Scan image for NSFW content
 * Note: This is a placeholder. In production, integrate with:
 * - Cloudinary Moderation API
 * - AWS Rekognition
 * - Google Vision API
 * - Or a local ML model
 * 
 * @param {string} imageUrl - URL of the image to scan
 * @param {string} method - Detection method ('api-cloudinary', 'api-aws', 'local')
 * @returns {Promise<{isNsfw: boolean, confidence: number, severity: string, details?: object}>}
 */
export async function detectNSFWImage(imageUrl, method = 'auto') {
  if (!imageUrl) {
    return {
      isNsfw: false,
      confidence: 0,
      severity: NSFW_SEVERITY.SAFE,
      details: { method: 'none', note: 'No image URL provided' }
    };
  }

  // Check if image URL is from a known NSFW domain
  const urlCheck = checkUrlForNSFW(imageUrl);
  if (urlCheck.isNsfw) {
    return {
      isNsfw: true,
      confidence: urlCheck.confidence,
      severity: NSFW_SEVERITY.EXPLICIT,
      details: { method: 'url-check', reason: urlCheck.reason }
    };
  }

  // Check image URL for NSFW keywords in the path
  const lowerUrl = imageUrl.toLowerCase();
  for (const keyword of NSFW_KEYWORDS) {
    if (lowerUrl.includes(keyword)) {
      return {
        isNsfw: true,
        confidence: 0.8,
        severity: NSFW_SEVERITY.EXPLICIT,
        details: { method: 'url-keyword', keyword }
      };
    }
  }

  // Placeholder for actual image analysis
  // In production, integrate with:
  // - Cloudinary Moderation API
  // - AWS Rekognition
  // - Google Vision API
  // - Or a local ML model
  
  // For now, if URL check passes, we can't reliably detect from image content
  // Return safe but with a note that actual detection isn't implemented
  return {
    isNsfw: false,
    confidence: 0,
    severity: NSFW_SEVERITY.SAFE,
    details: { method: 'placeholder', note: 'Image content analysis not yet implemented - only URL checking active' }
  };

  /* Example Cloudinary integration:
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`, {
      method: 'POST',
      body: JSON.stringify({ image: imageUrl, moderation: 'aws_rekognition' })
    });
    const data = await response.json();
    return {
      isNsfw: data.moderation?.[0]?.status === 'rejected',
      confidence: data.moderation?.[0]?.confidence || 0,
      severity: data.moderation?.[0]?.severity || NSFW_SEVERITY.SAFE
    };
  } catch (error) {
    console.error('Error detecting NSFW in image:', error);
    return { isNsfw: false, confidence: 0, severity: NSFW_SEVERITY.SAFE };
  }
  */
}

/**
 * Scan content (text + images) for NSFW
 * @param {object} content - Content object with text and/or images
 * @param {string} content.text - Text content
 * @param {Array<string>} content.images - Array of image URLs
 * @returns {Promise<{isNsfw: boolean, confidence: number, severity: string, method: string}>}
 */
export async function scanContentForNSFW(content) {
  const { text, images = [] } = content || {};

  // Scan text
  const textResult = await detectNSFWText(text || '');

  // Scan images (if any)
  let imageResult = { isNsfw: false, confidence: 0, severity: NSFW_SEVERITY.SAFE, urls: [] };
  if (images && images.length > 0) {
    // Check all images and take highest confidence
    const imageResults = await Promise.all(
      images.map(img => detectNSFWImage(img))
    );
    
    // Find the highest confidence result
    imageResult = imageResults.reduce((highest, current) => {
      if (current.confidence > highest.confidence) return current;
      if (current.isNsfw && !highest.isNsfw) return current;
      return highest;
    }, imageResult);
  }

  // Combine results - take highest confidence and combine URLs
  const isNsfw = textResult.isNsfw || imageResult.isNsfw;
  const confidence = Math.max(textResult.confidence, imageResult.confidence);
  
  // Combine URLs from both text and images
  const allUrls = [...(textResult.urls || []), ...(imageResult.urls || [])];
  
  const severity = 
    confidence > 0.7 ? NSFW_SEVERITY.EXPLICIT :
    confidence > 0.5 ? NSFW_SEVERITY.MODERATE :
    confidence > 0.3 ? NSFW_SEVERITY.MILD :
    NSFW_SEVERITY.SAFE;

  return {
    isNsfw,
    confidence,
    severity,
    method: images.length > 0 ? 'text+image' : 'text',
    urls: allUrls, // Include detected NSFW URLs
    keywords: textResult.keywords || []
  };
}

/**
 * Mark content as NSFW in database
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content ('post', 'comment')
 * @param {boolean} isNsfw - Whether content is NSFW
 * @param {number} confidence - Confidence score (0-1)
 * @param {string} method - Detection method ('manual', 'auto-text', 'auto-image', 'api')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markContentAsNSFW(contentId, contentType, isNsfw, confidence = null, method = 'manual') {
  try {
    const tableName = contentType === 'post' ? 'posts' : 'comments';
    
    const updateData = {
      is_nsfw: isNsfw,
      nsfw_detected_at: isNsfw ? new Date().toISOString() : null,
      nsfw_scan_method: method
    };

    if (confidence !== null) {
      updateData.nsfw_confidence = confidence;
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', contentId);

    if (error) throw error;

    // Log the scan
    await logNSFWScan(contentId, contentType, isNsfw ? 'nsfw' : 'safe', confidence, method);

    return { success: true };
  } catch (error) {
    console.error('Error marking content as NSFW:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log NSFW scan to database
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content
 * @param {string} scanResult - Result ('safe', 'nsfw', 'uncertain')
 * @param {number} confidence - Confidence score
 * @param {string} scanMethod - Method used
 * @param {object} scanDetails - Additional details
 * @returns {Promise<void>}
 */
export async function logNSFWScan(contentId, contentType, scanResult, confidence = null, scanMethod = 'auto', scanDetails = null) {
  try {
    const { error } = await supabase
      .from('nsfw_scan_log')
      .insert({
        content_id: contentId,
        content_type: contentType,
        scan_result: scanResult,
        confidence: confidence,
        scan_method: scanMethod,
        scan_details: scanDetails
      });

    if (error) {
      console.error('Error logging NSFW scan:', error);
    }
  } catch (error) {
    console.error('Error logging NSFW scan:', error);
  }
}

/**
 * Check if user can view NSFW content
 * NSFW content is not allowed on this platform - always returns false
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @returns {Promise<boolean>}
 */
export async function canViewNSFWContent(userId = null) {
  // NSFW content is not allowed on this platform
  return false;
}
