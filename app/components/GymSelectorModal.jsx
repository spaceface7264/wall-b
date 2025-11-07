import { useState, useEffect, useMemo } from 'react';
import { X, Search, MapPin, Navigation, Check, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance, formatDistance } from '../../lib/geolocation';

export default function GymSelectorModal({
  isOpen,
  onClose,
  selectedGymId,
  onSelectGym
}) {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'distance'
  const [isAdmin, setIsAdmin] = useState(false);
  
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
    isSupported: geolocationSupported
  } = useGeolocation();

  useEffect(() => {
    if (isOpen) {
      loadGyms();
    }
  }, [isOpen]);

  const loadGyms = async () => {
    try {
      setLoading(true);
      
      // Check admin status first
      let adminStatus = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          adminStatus = profile?.is_admin || false;
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      
      // Use select('*') to get all columns, more forgiving if schema has optional fields
      // We'll filter hidden gyms in code to ensure it works correctly
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading gyms:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Still set gyms to empty array so UI shows proper state
        setGyms([]);
        setLoading(false);
        return;
      }

      // Filter out hidden gyms for non-admins (additional check)
      const visibleGyms = adminStatus 
        ? (data || []) 
        : (data || []).filter(gym => !gym.is_hidden);

      // Calculate distances if location is available
      let gymsWithDistance = visibleGyms;
      
      console.log('Fetched gyms from database:', gymsWithDistance.length);
      
      // Always calculate distances if location is available (regardless of sortBy)
      // We'll sort later in filteredAndSortedGyms
      if (location) {
        gymsWithDistance = gymsWithDistance.map(gym => {
          if (gym.latitude && gym.longitude) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              gym.latitude,
              gym.longitude
            );
            return { ...gym, distance_km: distance };
          }
          return { ...gym, distance_km: null };
        });
      }

      console.log('Loaded gyms (with distances):', gymsWithDistance.length);
      setGyms(gymsWithDistance);
    } catch (error) {
      console.error('Error loading gyms (catch):', error);
      console.error('Error stack:', error.stack);
      // Ensure we set an empty array on error
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate distances when location becomes available
  useEffect(() => {
    if (isOpen && location && gyms.length > 0) {
      // Only recalculate if we don't already have distances
      const needsRecalculation = gyms.some(gym => gym.distance_km === undefined && gym.latitude && gym.longitude);
      if (needsRecalculation) {
        const gymsWithDistance = gyms.map(gym => {
          if (gym.latitude && gym.longitude && gym.distance_km === undefined) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              gym.latitude,
              gym.longitude
            );
            return { ...gym, distance_km: distance };
          }
          return gym;
        });
        setGyms(gymsWithDistance);
      }
    }
  }, [location, isOpen]);

  const filteredAndSortedGyms = useMemo(() => {
    let filtered = gyms;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(gym => 
        gym.name?.toLowerCase().includes(searchLower) ||
        gym.city?.toLowerCase().includes(searchLower) ||
        gym.country?.toLowerCase().includes(searchLower) ||
        gym.address?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortBy === 'distance' && location) {
      // Sort by distance, null distances go to the end
      filtered = [...filtered].sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    } else {
      // Sort alphabetically
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
    }

    return filtered;
  }, [gyms, searchTerm, sortBy, location]);

  const handleSelectGym = (gym) => {
    onSelectGym(gym.id);
    onClose();
  };

  const handleEnableGeolocation = () => {
    requestLocation();
    setSortBy('distance');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Select Gym</h3>
            <p className="text-sm text-gray-400 mt-1">
              Choose a gym for your community
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="p-4 border-b border-gray-700 space-y-3 flex-shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search gyms by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="minimal-input w-full pl-10 pr-3"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortBy('name')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                sortBy === 'name'
                  ? 'bg-[#00d4ff] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Sort by Name
            </button>
            {geolocationSupported && (
              <button
                onClick={location ? () => setSortBy('distance') : handleEnableGeolocation}
                disabled={locationLoading}
                className={`flex-1 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2 ${
                  sortBy === 'distance' && location
                    ? 'bg-[#00d4ff] text-white'
                    : locationLoading
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : location ? (
                  <>
                    <Navigation className="w-4 h-4" />
                    Sort by Distance
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Enable Location
                  </>
                )}
              </button>
            )}
          </div>

          {/* Location Status */}
          {locationError && (
            <p className="text-xs text-red-400">
              Location access denied. Sorting by distance is unavailable.
            </p>
          )}
        </div>

        {/* Gym List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading gyms...</p>
            </div>
          ) : filteredAndSortedGyms.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {searchTerm ? 'No gyms found matching your search.' : 'No gyms available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {filteredAndSortedGyms.map((gym) => {
                const isSelected = selectedGymId === gym.id;
                const facilities = Array.isArray(gym.facilities) 
                  ? gym.facilities 
                  : (typeof gym.facilities === 'string' ? JSON.parse(gym.facilities || '[]') : []);

                return (
                  <div
                    key={gym.id}
                    onClick={() => handleSelectGym(gym)}
                    className={`cursor-pointer transition-colors p-4 hover:bg-gray-800/50 ${
                      isSelected ? 'bg-[#00d4ff]/20 border-l-2 border-[#00d4ff]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Gym Logo */}
                      <div 
                        className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded border border-gray-700 overflow-hidden"
                        style={{ 
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px'
                        }}
                      >
                        {(gym.logo_url || gym.logo) ? (
                          <img
                            src={gym.logo_url || gym.logo}
                            alt={`${gym.name} logo`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-gradient-to-br from-[#00d4ff] to-[#00d4ff] flex items-center justify-center"
                          style={{ display: (gym.logo_url || gym.logo) ? 'none' : 'flex' }}
                        >
                          <span className="text-white font-semibold text-lg">
                            {gym.name ? gym.name.charAt(0).toUpperCase() : 'G'}
                          </span>
                        </div>
                      </div>

                      {/* Gym Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{gym.name}</h4>
                            {gym.is_hidden && isAdmin && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 rounded">
                                <EyeOff className="w-2.5 h-2.5" />
                                Hidden
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-[#00d4ff] flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {gym.city}, {gym.country}
                          </span>
                        </div>

                        {gym.address && (
                          <p className="text-xs text-gray-500 truncate mb-1">
                            {gym.address}
                          </p>
                        )}

                        {gym.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mb-1">
                            {gym.description}
                          </p>
                        )}

                        {gym.distance_km !== null && gym.distance_km !== undefined && (
                          <div className="flex items-center gap-1 mt-1">
                            <Navigation className="w-3 h-3 text-[#00d4ff]" />
                            <span className="text-xs text-[#00d4ff] font-medium">
                              {formatDistance(gym.distance_km)} away
                            </span>
                          </div>
                        )}

                        {facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {facilities.slice(0, 3).map((facility, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-800/50 px-2 py-0.5 rounded text-gray-300"
                              >
                                {facility}
                              </span>
                            ))}
                            {facilities.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{facilities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

