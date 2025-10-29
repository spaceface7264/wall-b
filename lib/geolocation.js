/**
 * Geolocation Utility Library
 * Provides functions for location-based features: geocoding, distance calculations, and recommendations
 */

/**
 * Get user's current location using browser Geolocation API
 * @param {Object} options - Geolocation options
 * @param {boolean} options.enableHighAccuracy - Enable high accuracy
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.maximumAge - Maximum age of cached position in milliseconds
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export async function getCurrentLocation(options = {}) {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address to coordinates using browser's built-in geocoding
 * Note: Browser geocoding is limited. For production, consider using a service like:
 * - Google Maps Geocoding API
 * - OpenStreetMap Nominatim (free, but has rate limits)
 * - Mapbox Geocoding API
 * 
 * @param {string} address - Address to geocode
 * @returns {Promise<{latitude: number, longitude: number, formatted_address: string}>}
 */
export async function geocodeAddress(address) {
  // For browser-based geocoding, we'll use a free service like OpenStreetMap Nominatim
  // This is a simple implementation - you may want to add caching and error handling
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Wall-B Climbing App', // Nominatim requires a user agent
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Address not found');
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      place_id: result.place_id,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{address: string, city: string, country: string}>}
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'Wall-B Climbing App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding service unavailable');
    }

    const data = await response.json();

    if (!data || !data.address) {
      throw new Error('Location not found');
    }

    const addr = data.address;
    return {
      address: data.display_name,
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      country: addr.country || '',
      country_code: addr.country_code?.toUpperCase() || '',
      postcode: addr.postcode || '',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
}

/**
 * Find nearby items from a list based on user location
 * @param {Array} items - Array of items with latitude/longitude
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} Items within radius, sorted by distance
 */
export function findNearbyItems(items, userLat, userLon, radiusKm = 50) {
  return items
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({
      ...item,
      distance_km: calculateDistance(userLat, userLon, item.latitude, item.longitude),
    }))
    .filter((item) => item.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Check if geolocation is available
 * @returns {boolean}
 */
export function isGeolocationAvailable() {
  return 'geolocation' in navigator;
}

/**
 * Request location permissions and return status
 * @returns {Promise<'granted' | 'denied' | 'prompt'>}
 */
export async function requestLocationPermission() {
  if (!('permissions' in navigator)) {
    // Fallback: try to get location and see if it works
    try {
      await getCurrentLocation({ timeout: 1000 });
      return 'granted';
    } catch {
      return 'prompt';
    }
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    // If query fails, try to get location
    try {
      await getCurrentLocation({ timeout: 1000 });
      return 'granted';
    } catch {
      return 'prompt';
    }
  }
}

