import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Heart, MoreVertical, Navigation } from 'lucide-react';
import GymCard from '../components/GymCard';
import { useToast } from '../providers/ToastProvider';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../../lib/geolocation';
import { EmptyGyms } from '../components/EmptyState';

// Note: This component is wrapped with SidebarLayout in App.jsx, so don't wrap here

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteGymIds, setFavoriteGymIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [geolocationEnabled, setGeolocationEnabled] = useState(() => {
    const saved = localStorage.getItem('gymsGeolocationEnabled');
    return saved === 'true';
  });
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Geolocation hook
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
    isSupported: geolocationSupported
  } = useGeolocation();

  useEffect(() => {
    getUser();
    fetchGyms();
  }, []);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadFavoriteGyms(user.id);
      }
    } catch (error) {
      console.log('Error getting user:', error);
    }
  };

  const loadFavoriteGyms = async (userId) => {
    try {
      const { data: favorites, error } = await supabase
        .from('user_favorite_gyms')
        .select('gym_id')
        .eq('user_id', userId);

      if (error) {
        console.log('Error loading favorite gyms:', error);
        return;
      }

      const favoriteIds = new Set(favorites?.map(fav => fav.gym_id) || []);
      setFavoriteGymIds(favoriteIds);
    } catch (error) {
      console.log('Error loading favorite gyms:', error);
    }
  };

  const fetchGyms = async () => {
    try {
      setLoading(true);
      // Fetch gyms from database
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching gyms:', error);
        // Fallback to mock data if database doesn't exist yet
        const mockGyms = [
          {
            id: "11111111-1111-1111-1111-111111111111",
            name: "The Climbing Hangar",
            country: "United Kingdom",
            city: "London",
            address: "123 Climbing Street, London E1 6AN",
            phone: "+44 20 1234 5678",
            email: "info@climbinghangar.com",
            website: "https://climbinghangar.com",
            description: "Premier bouldering gym in the heart of London with world-class facilities and routes for all levels.",
            image_url: "https://images.unsplash.com/photo-1544551763-46a013bb2d26?w=800",
            facilities: ["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms"],
            opening_hours: {
              monday: "6:00-23:00",
              tuesday: "6:00-23:00",
              wednesday: "6:00-23:00",
              thursday: "6:00-23:00",
              friday: "6:00-23:00",
              saturday: "8:00-22:00",
              sunday: "8:00-22:00"
            },
            price_range: "£15-25",
            difficulty_levels: ["Beginner", "Intermediate", "Advanced", "Expert"]
          },
          {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Boulder World",
            country: "Germany",
            city: "Berlin",
            address: "456 Bouldering Boulevard, 10115 Berlin",
            phone: "+49 30 12345678",
            email: "berlin@boulderworld.de",
            website: "https://boulderworld.de",
            description: "Modern bouldering facility with innovative route setting and excellent training equipment.",
            image_url: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800",
            facilities: ["Cafe", "Shop", "Training Area", "Sauna", "Massage", "Locker Rooms", "Parking"],
            opening_hours: {
              monday: "7:00-24:00",
              tuesday: "7:00-24:00",
              wednesday: "7:00-24:00",
              thursday: "7:00-24:00",
              friday: "7:00-24:00",
              saturday: "9:00-23:00",
              sunday: "9:00-23:00"
            },
            price_range: "€18-28",
            difficulty_levels: ["Beginner", "Intermediate", "Advanced", "Expert", "Competition"]
          },
          {
            id: "33333333-3333-3333-3333-333333333333",
            name: "Vertical Dreams",
            country: "France",
            city: "Paris",
            address: "789 Rue de l'Escalade, 75011 Paris",
            phone: "+33 1 23 45 67 89",
            email: "paris@verticaldreams.fr",
            website: "https://verticaldreams.fr",
            description: "Historic climbing gym with traditional charm and modern bouldering facilities in the heart of Paris.",
            image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
            facilities: ["Cafe", "Shop", "Training Area", "Yoga Studio", "Locker Rooms", "Equipment Rental"],
            opening_hours: {
              monday: "6:30-22:30",
              tuesday: "6:30-22:30",
              wednesday: "6:30-22:30",
              thursday: "6:30-22:30",
              friday: "6:30-22:30",
              saturday: "9:00-21:00",
              sunday: "9:00-21:00"
            },
            price_range: "€16-26",
            difficulty_levels: ["Beginner", "Intermediate", "Advanced"]
          },
          {
            id: "44444444-4444-4444-4444-444444444444",
            name: "Summit Climbing Center",
            country: "United States",
            city: "Boulder",
            address: "321 Mountain View Drive, Boulder, CO 80301",
            phone: "+1 303 555 9876",
            email: "info@summitclimbing.com",
            website: "https://summitclimbing.com",
            description: "State-of-the-art climbing facility with world-class bouldering walls, lead climbing routes, and comprehensive training programs for climbers of all skill levels.",
            image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            facilities: ["Cafe", "Shop", "Training Area", "Yoga Studio", "Kids Area", "Locker Rooms", "Parking", "Equipment Rental", "Bike Storage"],
            opening_hours: {
              monday: "5:00-23:00",
              tuesday: "5:00-23:00",
              wednesday: "5:00-23:00",
              thursday: "5:00-23:00",
              friday: "5:00-23:00",
              saturday: "7:00-22:00",
              sunday: "7:00-22:00"
            },
            price_range: "$22-32",
            difficulty_levels: ["Beginner", "Intermediate", "Advanced", "Expert", "Competition"]
          }
        ];
        setGyms(mockGyms);
      } else if (data && data.length > 0) {
        setGyms(data);
      } else {
        setGyms(data || []);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Request location when toggle is enabled and location not available
  useEffect(() => {
    if (geolocationEnabled && !location && !locationLoading && geolocationSupported && !locationError) {
      requestLocation();
    }
  }, [geolocationEnabled, location, locationLoading, geolocationSupported, locationError, requestLocation]);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showMenu]);

  // Handle location errors
  useEffect(() => {
    if (locationError && geolocationEnabled) {
      if (locationError.message.includes('denied')) {
        showToast('error', 'Location Access Denied', 'Please enable location permissions to sort by distance');
      } else if (locationError.message.includes('not supported')) {
        showToast('error', 'Geolocation Not Supported', 'Your browser does not support geolocation');
      } else {
        showToast('error', 'Location Error', locationError.message || 'Unable to get your location');
      }
    }
  }, [locationError, geolocationEnabled, showToast]);

  const handleToggleGeolocation = () => {
    const newValue = !geolocationEnabled;
    setGeolocationEnabled(newValue);
    localStorage.setItem('gymsGeolocationEnabled', String(newValue));
    
    if (newValue && !location && !locationLoading && geolocationSupported) {
      requestLocation();
    }
  };

  // Filter gyms by search term
  let filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate distances and sort when geolocation is enabled
  if (geolocationEnabled && location) {
    filteredGyms = filteredGyms.map(gym => {
      // Only calculate distance if gym has coordinates
      if (gym.latitude && gym.longitude) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          gym.latitude,
          gym.longitude
        );
        return { ...gym, distance_km: distance };
      }
      // Gym without coordinates - set to Infinity so it sorts to end
      return { ...gym, distance_km: Infinity };
    }).sort((a, b) => {
      // Sort by distance, gyms without coordinates go to end
      const distA = a.distance_km || Infinity;
      const distB = b.distance_km || Infinity;
      return distA - distB;
    });
  } else {
    // Remove distance property when geolocation is disabled
    filteredGyms = filteredGyms.map(gym => {
      const { distance_km, ...gymWithoutDistance } = gym;
      return gymWithoutDistance;
    });
  }

  const openGym = (gym) => {
    console.log('Opening gym:', gym);
    console.log('Gym ID:', gym.id);
    navigate(`/gyms/${gym.id}`);
  };

  const toggleFavorite = async (gymId) => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to save favorites');
      return;
    }

    try {
      const isFavorite = favoriteGymIds.has(gymId);
      
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorite_gyms')
          .delete()
          .eq('user_id', user.id)
          .eq('gym_id', gymId);

        if (error) {
          console.error('Error removing favorite:', error);
          showToast('error', 'Error', 'Failed to remove from favorites');
          return;
        }

        setFavoriteGymIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(gymId);
          return newSet;
        });

        showToast('success', 'Removed', 'Gym removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorite_gyms')
          .insert({
            user_id: user.id,
            gym_id: gymId
          });

        if (error) {
          console.error('Error adding favorite:', error);
          showToast('error', 'Error', 'Failed to add to favorites');
          return;
        }

        setFavoriteGymIds(prev => new Set([...prev, gymId]));
        showToast('success', 'Added!', 'Gym added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };


  return (
    <div className="mobile-container">

        {/* Search and Menu */}
        <div className="animate-slide-up" style={{ position: 'relative', zIndex: 50 }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search gyms..."
              className="flex-1 minimal-input"
            />
            <div className="relative flex-shrink-0">
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showMenu) {
                    // Calculate menu position
                    const button = e.currentTarget;
                    const rect = button.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 4,
                      right: window.innerWidth - rect.right
                    });
                  }
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Overlay to close menu */}
                  <div 
                    className="fixed inset-0 z-[1000]" 
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Dropdown Menu - fixed positioning */}
                  <div
                    role="menu"
                    ref={menuRef}
                    className="fixed rounded-lg shadow-xl z-[1100]"
                    style={{ 
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`,
                      minWidth: '180px',
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      maxHeight: 'calc(100vh - 20px)',
                      overflowY: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleGeolocation();
                      setShowMenu(false);
                    }}
                    disabled={locationLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      fontSize: '11px',
                      color: geolocationEnabled ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => !locationLoading && (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    role="menuitem"
                  >
                    {locationLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ flexShrink: 0 }}></div>
                    ) : (
                      <Navigation className="w-3.5 h-3.5" style={{ flexShrink: 0, color: geolocationEnabled ? '#087E8B' : 'var(--text-muted)' }} />
                    )}
                    <span>{geolocationEnabled ? 'Turn off location' : 'Turn on location'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/gyms/request');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                    style={{ 
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-color)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    role="menuitem"
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                    <span>Request Gym</span>
                  </button>
                </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Gyms List */}
        <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
            {loading ? (
              <div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-fade-in w-full border-b border-gray-700/50 last:border-b-0" style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', gap: '16px', padding: '0 16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-skeleton h-4 w-3/4 mb-3"></div>
                        <div className="mobile-skeleton h-3 w-1/2 mb-3"></div>
                        <div className="mobile-skeleton h-3 w-2/3 mb-3"></div>
                        <div className="flex gap-1 mt-3">
                          <div className="mobile-skeleton h-5 w-16 rounded"></div>
                          <div className="mobile-skeleton h-5 w-12 rounded"></div>
                          <div className="mobile-skeleton h-5 w-14 rounded"></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                        <div className="mobile-skeleton h-3 w-20 mb-2"></div>
                        <div className="mobile-skeleton h-4 w-4 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGyms.length === 0 ? (
              <EmptyGyms onRequestClick={() => navigate('/gyms/request')} />
            ) : (
              filteredGyms.map((gym, index) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  onOpen={openGym}
                />
              ))
            )}
        </div>
      </div>
  );
}
