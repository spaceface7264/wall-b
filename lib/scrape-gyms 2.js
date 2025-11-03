/**
 * Google Places API Integration Utilities
 * Functions for searching and fetching gym data from Google Places API
 */

import scraperConfig from './config-scraper.js';

/**
 * Delay helper for rate limiting
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Search for places using Google Places Text Search API
 * @param {string} query - Search query (e.g., "climbing gym Copenhagen")
 * @param {string} location - Location string (e.g., "Copenhagen, Denmark")
 * @returns {Promise<Array>} Array of place results
 */
export async function searchPlaces(query, location = null) {
  const apiKey = scraperConfig.googlePlaces.apiKey;
  const baseUrl = scraperConfig.googlePlaces.baseUrl;
  const endpoint = scraperConfig.googlePlaces.textSearchEndpoint;

  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  // Build query parameters
  // Use more specific query to target climbing gyms
  const params = new URLSearchParams({
    query: `${query} ${location ? `in ${location}` : 'in Denmark'}`,
    key: apiKey,
    // Note: Google Places Text Search doesn't support multiple types
    // We'll filter by climbing-related keywords and types in results
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return data.results || [];
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded. Please wait before trying again.');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Places API request denied: ${data.error_message || 'Invalid API key or permissions'}`);
    } else {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Get detailed information about a place using Place Details API
 * @param {string} placeId - Google Places place_id
 * @returns {Promise<Object>} Detailed place information
 */
export async function getPlaceDetails(placeId) {
  const apiKey = scraperConfig.googlePlaces.apiKey;
  const baseUrl = scraperConfig.googlePlaces.baseUrl;
  const endpoint = scraperConfig.googlePlaces.detailsEndpoint;

  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  // Request specific fields to reduce API costs
  const fields = [
    'name',
    'formatted_address',
    'address_components',
    'geometry',
    'international_phone_number',
    'website',
    'photo',
    'opening_hours',
    'rating',
    'user_ratings_total',
    'types',
    'editorial_summary',
  ].join(',');

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key: apiKey,
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded. Please wait before trying again.');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google Places API request denied: ${data.error_message || 'Invalid API key or permissions'}`);
    } else {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Parse address components to extract city and country
 * @param {Array} addressComponents - Google Places address_components array
 * @returns {Object} { city, country, countryCode }
 */
export function parseAddressComponents(addressComponents) {
  let city = '';
  let country = '';
  let countryCode = '';

  if (!addressComponents || !Array.isArray(addressComponents)) {
    return { city, country, countryCode };
  }

  for (const component of addressComponents) {
    const types = component.types || [];
    
    if (types.includes('locality') || types.includes('administrative_area_level_2')) {
      city = component.long_name || city;
    }
    
    if (types.includes('country')) {
      country = component.long_name || country;
      countryCode = component.short_name || countryCode;
    }
  }

  return { city, country, countryCode };
}

/**
 * Get photo URL from Google Places photo reference
 * @param {string} photoReference - Photo reference from Google Places
 * @param {number} maxWidth - Maximum width (default: 800)
 * @returns {string} Photo URL
 */
export function getPhotoUrl(photoReference, maxWidth = 800) {
  const apiKey = scraperConfig.googlePlaces.apiKey;
  const baseUrl = scraperConfig.googlePlaces.baseUrl;
  
  if (!photoReference || !apiKey) {
    return null;
  }

  return `${baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

/**
 * Check if a place is a climbing gym based on types and keywords
 * @param {Object} place - Google Places place object
 * @returns {boolean} True if it appears to be a climbing gym
 */
export function isClimbingGym(place) {
  const name = (place.name || '').toLowerCase();
  const types = place.types || [];
  
  // Climbing-related keywords
  const climbingKeywords = [
    'klatre', 'klatring', 'klatrehal', 'klatresenter', // Danish
    'climbing', 'boulder', 'bouldering', 'rock climb',
    'indoor climbing', 'climbing gym', 'climbing wall',
    'mountain climbing', 'sport climbing'
  ];
  
  // Climbing-related Google Places types (if available)
  const climbingTypes = [
    'gym', // General gym type (we'll check name for climbing keywords)
  ];
  
  // Check name for climbing keywords
  const nameHasClimbingKeyword = climbingKeywords.some(keyword => 
    name.includes(keyword)
  );
  
  // If name contains climbing keywords, it's likely a climbing gym
  if (nameHasClimbingKeyword) {
    return true;
  }
  
  // Additional check: if it has 'gym' type but name doesn't have climbing keywords,
  // we'll still include it but let the admin review (better to include than exclude)
  // Actually, for now let's be more strict - require climbing keywords
  return false;
}

/**
 * Map Google Places data to gym_request schema
 * @param {Object} placeData - Google Places place details
 * @returns {Object} Mapped gym request data
 */
export function mapPlaceToGymRequest(placeData) {
  const addressComponents = parseAddressComponents(placeData.address_components || []);
  const geometry = placeData.geometry || {};
  const location = geometry.location || {};

  // Extract description from editorial summary or generate from types
  let description = '';
  if (placeData.editorial_summary?.overview) {
    description = placeData.editorial_summary.overview;
  } else if (placeData.types && placeData.types.length > 0) {
    const typeDescriptions = placeData.types
      .filter(type => type !== 'point_of_interest' && type !== 'establishment')
      .map(type => type.replace(/_/g, ' '))
      .join(', ');
    description = `A ${typeDescriptions} facility`;
  }

  // Get first photo if available
  let imageUrl = null;
  if (placeData.photos && placeData.photos.length > 0) {
    imageUrl = getPhotoUrl(placeData.photos[0].photo_reference);
  }

  return {
    gym_name: placeData.name || '',
    country: addressComponents.country || scraperConfig.search.country,
    city: addressComponents.city || '',
    address: placeData.formatted_address || '',
    phone: placeData.international_phone_number || null,
    email: null, // Not available from Google Places API
    website: placeData.website || null,
    description: description || null,
    facilities: [], // To be filled manually or via AI
    latitude: location.lat || null,
    longitude: location.lng || null,
    image_url: imageUrl,
    // Metadata
    source_data: {
      scraped_from: 'google_places',
      place_id: placeData.place_id,
      rating: placeData.rating || null,
      user_ratings_total: placeData.user_ratings_total || 0,
      types: placeData.types || [],
    },
  };
}

/**
 * Search and fetch place details with retry logic and rate limiting
 * @param {string} query - Search query
 * @param {string} location - Location string
 * @returns {Promise<Array>} Array of mapped gym request data
 */
export async function searchAndFetchGyms(query, location) {
  const results = [];
  const rateLimit = scraperConfig.googlePlaces.rateLimit;

  try {
    // Search for places
    console.log(`Searching for: "${query}" in ${location}`);
    const places = await searchPlaces(query, location);
    
    // Rate limit delay
    await delay(rateLimit.delayBetweenRequests);

    // Fetch details for each place
    for (const place of places) {
      // First check if this place looks like a climbing gym (quick check before fetching details)
      // Note: We'll do a more thorough check after getting details
      let retries = rateLimit.maxRetries;
      let placeDetails = null;

      while (retries > 0 && !placeDetails) {
        try {
          placeDetails = await getPlaceDetails(place.place_id);
          await delay(rateLimit.delayBetweenRequests);
        } catch (error) {
          retries--;
          if (retries > 0) {
            console.warn(`Retrying place details for ${place.place_id}... (${rateLimit.maxRetries - retries}/${rateLimit.maxRetries})`);
            await delay(rateLimit.retryDelay);
          } else {
            console.error(`Failed to fetch details for ${place.name}:`, error.message);
          }
        }
      }

      if (placeDetails) {
        // Filter: Only include if it's a climbing gym
        if (isClimbingGym(placeDetails)) {
          const gymRequest = mapPlaceToGymRequest(placeDetails);
          results.push(gymRequest);
        } else {
          console.log(`⊘ Skipping non-climbing gym: ${placeDetails.name}`);
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error searching for "${query}" in ${location}:`, error.message);
    throw error;
  }
}

/**
 * Check if a gym already exists or has a pending request
 * @param {Object} supabase - Supabase client
 * @param {string} gymName - Gym name
 * @param {string} city - City name
 * @returns {Promise<boolean>} True if duplicate exists
 */
export async function isDuplicateGym(supabase, gymName, city) {
  try {
    // Check existing gyms
    const { data: existingGyms } = await supabase
      .from('gyms')
      .select('id')
      .eq('name', gymName)
      .eq('city', city)
      .limit(1);

    if (existingGyms && existingGyms.length > 0) {
      return true;
    }

    // Check existing requests (pending or approved)
    const { data: existingRequests } = await supabase
      .from('gym_requests')
      .select('id')
      .eq('gym_name', gymName)
      .eq('city', city)
      .in('status', ['pending', 'approved'])
      .limit(1);

    return existingRequests && existingRequests.length > 0;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    // On error, assume not duplicate to avoid false positives
    return false;
  }
}

