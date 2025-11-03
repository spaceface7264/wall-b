/**
 * React Hook for Geolocation
 * Provides easy-to-use geolocation functionality with state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLocation,
  calculateDistance,
  isGeolocationAvailable,
  requestLocationPermission,
} from '../../lib/geolocation';
import { supabase } from '../../lib/supabase';

/**
 * Custom hook for geolocation functionality
 * @param {Object} options - Hook options
 * @param {boolean} options.autoRequest - Automatically request location on mount
 * @param {number} options.defaultRadius - Default search radius in kilometers
 * @returns {Object} Geolocation hook interface
 */
export function useGeolocation(options = {}) {
  const { autoRequest = false, defaultRadius = 50 } = options;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isSupported, setIsSupported] = useState(false);

  // Check if geolocation is supported
  useEffect(() => {
    setIsSupported(isGeolocationAvailable());
    if (isGeolocationAvailable()) {
      checkPermissionStatus().catch(() => {
        // Silently fail - permission check is optional
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await requestLocationPermission();
      setPermissionStatus(status);
    } catch (err) {
      console.error('Error checking permission status:', err);
    }
  };

  /**
   * Request user's current location
   */
  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      setError(new Error('Geolocation is not supported by your browser'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentLocation();
      setLocation(position);
      
      // Save location preference to user profile if authenticated
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              latitude: position.latitude,
              longitude: position.longitude,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      } catch (profileError) {
        // Silently fail - saving location preference is optional
        console.warn('Could not save location preference:', profileError);
      }
    } catch (err) {
      setError(err);
      setLocation(null);
      
      if (err.message.includes('denied')) {
        setPermissionStatus('denied');
      }
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  /**
   * Clear location data
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  /**
   * Calculate distance from user location to a point
   */
  const getDistanceTo = useCallback(
    (lat, lon) => {
      if (!location) return null;
      return calculateDistance(location.latitude, location.longitude, lat, lon);
    },
    [location]
  );

  /**
   * Check if a point is within radius
   */
  const isWithinRadius = useCallback(
    (lat, lon, radiusKm = defaultRadius) => {
      if (!location) return false;
      const distance = getDistanceTo(lat, lon);
      return distance !== null && distance <= radiusKm;
    },
    [location, defaultRadius, getDistanceTo]
  );

  // Auto-request location if enabled (with guard to prevent infinite loops)
  // This must come after requestLocation is defined
  useEffect(() => {
    if (autoRequest && isSupported && !location && !loading && permissionStatus !== 'denied' && !error) {
      requestLocation().catch(() => {
        // Silently handle errors - error state is already set by requestLocation
      });
    }
  }, [autoRequest, isSupported, location, loading, permissionStatus, error, requestLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    isSupported,
    requestLocation,
    clearLocation,
    getDistanceTo,
    isWithinRadius,
    checkPermissionStatus,
  };
}

/**
 * Hook for finding nearby gyms
 * @param {Object} options - Hook options
 * @param {number} options.radiusKm - Search radius in kilometers
 * @param {number} options.limit - Maximum number of results
 * @returns {Object} Nearby gyms hook interface
 */
export function useNearbyGyms(options = {}) {
  const { radiusKm = 50, limit = 20 } = options;
  const { location, loading: locationLoading, requestLocation } = useGeolocation();

  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch nearby gyms
   */
  const fetchNearbyGyms = useCallback(async () => {
    if (!location) {
      setError(new Error('Location not available. Please enable location access.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Supabase RPC function if available, otherwise fetch all and filter client-side
      const { data, error: rpcError } = await supabase.rpc('find_nearby_gyms', {
        user_lat: location.latitude,
        user_lon: location.longitude,
        radius_km: radiusKm,
        limit_count: limit,
      });

      if (rpcError) {
        // Fallback to client-side filtering
        const { data: allGyms, error: fetchError } = await supabase
          .from('gyms')
          .select('*');

        if (fetchError) throw fetchError;

        const nearbyGyms = allGyms
          .filter((gym) => gym.latitude && gym.longitude)
          .map((gym) => ({
            ...gym,
            distance_km: calculateDistance(
              location.latitude,
              location.longitude,
              gym.latitude,
              gym.longitude
            ),
          }))
          .filter((gym) => gym.distance_km <= radiusKm)
          .sort((a, b) => a.distance_km - b.distance_km)
          .slice(0, limit);

        setGyms(nearbyGyms);
      } else {
        setGyms(data || []);
      }
    } catch (err) {
      setError(err);
      console.error('Error fetching nearby gyms:', err);
    } finally {
      setLoading(false);
    }
  }, [location, radiusKm, limit]);

  // Auto-fetch when location is available
  useEffect(() => {
    if (location && !locationLoading) {
      fetchNearbyGyms();
    }
  }, [location, locationLoading, fetchNearbyGyms]);

  return {
    gyms,
    loading: loading || locationLoading,
    error,
    fetchNearbyGyms,
    location,
    requestLocation,
  };
}

/**
 * Hook for finding nearby events
 * @param {Object} options - Hook options
 * @param {number} options.radiusKm - Search radius in kilometers
 * @param {number} options.limit - Maximum number of results
 * @returns {Object} Nearby events hook interface
 */
export function useNearbyEvents(options = {}) {
  const { radiusKm = 50, limit = 20 } = options;
  const { location, loading: locationLoading, requestLocation } = useGeolocation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyEvents = useCallback(async () => {
    if (!location) {
      setError(new Error('Location not available. Please enable location access.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('find_nearby_events', {
        user_lat: location.latitude,
        user_lon: location.longitude,
        radius_km: radiusKm,
        limit_count: limit,
      });

      if (rpcError) {
        // Fallback to client-side filtering
        const { data: allEvents, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .gte('event_date', new Date().toISOString()); // Only future events

        if (fetchError) throw fetchError;

        const nearbyEvents = allEvents
          .filter((event) => event.latitude && event.longitude)
          .map((event) => ({
            ...event,
            distance_km: calculateDistance(
              location.latitude,
              location.longitude,
              event.latitude,
              event.longitude
            ),
          }))
          .filter((event) => event.distance_km <= radiusKm)
          .sort((a, b) => a.distance_km - b.distance_km)
          .slice(0, limit);

        setEvents(nearbyEvents);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      setError(err);
      console.error('Error fetching nearby events:', err);
    } finally {
      setLoading(false);
    }
  }, [location, radiusKm, limit]);

  useEffect(() => {
    if (location && !locationLoading) {
      fetchNearbyEvents();
    }
  }, [location, locationLoading, fetchNearbyEvents]);

  return {
    events,
    loading: loading || locationLoading,
    error,
    fetchNearbyEvents,
    location,
    requestLocation,
  };
}

