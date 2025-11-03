import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Heart, MoreVertical, Navigation, Filter, X, ChevronDown, ChevronUp, SlidersHorizontal, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import GymCard from '../components/GymCard';
import { useToast } from '../providers/ToastProvider';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../../lib/geolocation';
import { EmptyGyms } from '../components/EmptyState';

const availableFacilities = [
  'Kilter Board',
  'Moon Board',
  'Spray Wall',
  'Shower',
  'Parking',
  'Cafe',
  'Shop',
  'Training Area',
  'Yoga Studio',
  'Kids Area',
  'Locker Rooms',
  'Equipment Rental',
  'Sauna',
  'Massage',
  'Bike Storage',
  'Outdoor Terrace',
  'Lead Climbing',
  'Top Rope',
  'Auto Belay',
  'Pro Shop'
];

const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Competition'];

// Note: This component is wrapped with SidebarLayout in App.jsx, so don't wrap here

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [favoriteGymIds, setFavoriteGymIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(() => {
    const saved = localStorage.getItem('gymsGeolocationEnabled');
    return saved === 'true';
  });
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveFilterDialog, setShowSaveFilterDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState([]);
  
  // Filter states
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [distanceRadius, setDistanceRadius] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name-a-z');
  
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
    loadSavedFilters();
  }, []);

  // Fetch gyms when admin status is determined
  useEffect(() => {
    fetchGyms();
  }, [isAdmin]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('gymSavedFilters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  // Save filters to localStorage
  const saveFiltersToStorage = (filters) => {
    try {
      localStorage.setItem('gymSavedFilters', JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error saving filters:', error);
      showToast('error', 'Error', 'Failed to save filters');
    }
  };

  // Save current filter preset
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      showToast('error', 'Name Required', 'Please enter a name for this filter');
      return;
    }

    const currentFilters = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: {
        selectedFacilities: [...selectedFacilities],
        selectedCountry,
        selectedCity,
        selectedDifficulties: [...selectedDifficulties],
        priceRange: { ...priceRange },
        distanceRadius,
        favoritesOnly,
        sortBy
      },
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, currentFilters];
    saveFiltersToStorage(updatedFilters);
    setFilterName('');
    setShowSaveFilterDialog(false);
    showToast('success', 'Saved!', 'Filter preset saved successfully');
  };

  // Apply a saved filter
  const handleApplySavedFilter = (savedFilter) => {
    const { filters } = savedFilter;
    setSelectedFacilities(filters.selectedFacilities || []);
    setSelectedCountry(filters.selectedCountry || '');
    setSelectedCity(filters.selectedCity || '');
    setSelectedDifficulties(filters.selectedDifficulties || []);
    setPriceRange(filters.priceRange || { min: '', max: '' });
    setDistanceRadius(filters.distanceRadius ?? null);
    setFavoritesOnly(filters.favoritesOnly || false);
    setSortBy(filters.sortBy || 'name-a-z');
    setShowFilters(false);
    showToast('success', 'Applied', `Applied filter: ${savedFilter.name}`);
  };

  // Delete a saved filter
  const handleDeleteSavedFilter = (filterId, e) => {
    e.stopPropagation();
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    saveFiltersToStorage(updatedFilters);
    showToast('success', 'Deleted', 'Filter preset deleted');
  };

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadFavoriteGyms(user.id);
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
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
      // We'll filter hidden gyms in code to ensure it works correctly
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
        // Filter out hidden gyms for non-admins (additional check in case query didn't work)
        const visibleGyms = isAdmin 
          ? data 
          : data.filter(gym => !gym.is_hidden);
        setGyms(visibleGyms);
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

  // Handle location errors (only show important ones, suppress common dev environment errors)
  useEffect(() => {
    if (locationError && geolocationEnabled) {
      // Only show errors that are actionable - suppress "unavailable" errors
      // which are common in dev/simulators and don't need user attention
      if (locationError.message.includes('denied')) {
        showToast('error', 'Location Access Denied', 'Please enable location permissions to sort by distance');
      } else if (locationError.message.includes('not supported')) {
        showToast('error', 'Geolocation Not Supported', 'Your browser does not support geolocation');
      } else if (!locationError.message.includes('unavailable')) {
        // Only show other errors (not "unavailable" which is common in dev)
        showToast('error', 'Location Error', locationError.message || 'Unable to get your location');
      }
      // Silently handle "unavailable" errors - they're common in dev/simulators
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

  // Parse price range from string (e.g., "£15-25", "$20-30", "€16-26")
  const parsePriceRange = (priceStr) => {
    if (!priceStr) return { min: null, max: null };
    const match = priceStr.match(/[\d.]+/g);
    if (match && match.length >= 2) {
      return { min: parseFloat(match[0]), max: parseFloat(match[1]) };
    } else if (match && match.length === 1) {
      return { min: parseFloat(match[0]), max: null };
    }
    return { min: null, max: null };
  };

  // Generate unique countries and cities from gym data
  const { countries, citiesByCountry } = useMemo(() => {
    const countrySet = new Set();
    const citiesMap = new Map();
    
    gyms.forEach(gym => {
      if (gym.country) {
        countrySet.add(gym.country);
        if (!citiesMap.has(gym.country)) {
          citiesMap.set(gym.country, new Set());
        }
        if (gym.city) {
          citiesMap.get(gym.country).add(gym.city);
        }
      }
    });
    
    const citiesByCountryObj = {};
    citiesMap.forEach((cities, country) => {
      citiesByCountryObj[country] = Array.from(cities).sort();
    });
    
    return {
      countries: Array.from(countrySet).sort(),
      citiesByCountry: citiesByCountryObj
    };
  }, [gyms]);

  // Get facilities array from gym (handle both array and JSON string)
  const getGymFacilities = (gym) => {
    if (!gym.facilities) return [];
    if (Array.isArray(gym.facilities)) return gym.facilities;
    try {
      return JSON.parse(gym.facilities);
    } catch {
      return [];
    }
  };

  // Get difficulty levels array from gym
  const getGymDifficulties = (gym) => {
    if (!gym.difficulty_levels) return [];
    if (Array.isArray(gym.difficulty_levels)) return gym.difficulty_levels;
    return [];
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFacilities.length > 0) count++;
    if (selectedCountry) count++;
    if (selectedCity) count++;
    if (selectedDifficulties.length > 0) count++;
    if (priceRange.min || priceRange.max) count++;
    if (distanceRadius !== null) count++;
    if (favoritesOnly) count++;
    return count;
  }, [selectedFacilities, selectedCountry, selectedCity, selectedDifficulties, priceRange, distanceRadius, favoritesOnly]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedFacilities([]);
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedDifficulties([]);
    setPriceRange({ min: '', max: '' });
    setDistanceRadius(null);
    setFavoritesOnly(false);
    setSortBy('name-a-z');
  }, []);

  // Comprehensive filtering and sorting
  const filteredGyms = useMemo(() => {
    let filtered = [...gyms];

    // Enhanced search: name, city, country, address, description, facilities
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(gym => {
        const nameMatch = gym.name?.toLowerCase().includes(searchLower);
        const cityMatch = gym.city?.toLowerCase().includes(searchLower);
        const countryMatch = gym.country?.toLowerCase().includes(searchLower);
        const addressMatch = gym.address?.toLowerCase().includes(searchLower);
        const descriptionMatch = gym.description?.toLowerCase().includes(searchLower);
        
        // Search in facilities
        const facilities = getGymFacilities(gym);
        const facilityMatch = facilities.some(facility => 
          facility.toLowerCase().includes(searchLower)
        );
        
        return nameMatch || cityMatch || countryMatch || addressMatch || 
               descriptionMatch || facilityMatch;
      });
    }

    // Filter by facilities (OR logic within selection - gym must have at least one selected facility)
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter(gym => {
        const facilities = getGymFacilities(gym);
        return selectedFacilities.some(facility => facilities.includes(facility));
      });
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(gym => gym.country === selectedCountry);
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(gym => gym.city === selectedCity);
    }

    // Filter by difficulty levels (OR logic - gym must have at least one selected difficulty)
    if (selectedDifficulties.length > 0) {
      filtered = filtered.filter(gym => {
        const difficulties = getGymDifficulties(gym);
        return selectedDifficulties.some(difficulty => difficulties.includes(difficulty));
      });
    }

    // Filter by price range
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(gym => {
        if (!gym.price_range) return false;
        const gymPrice = parsePriceRange(gym.price_range);
        if (priceRange.min && gymPrice.max !== null && gymPrice.max < parseFloat(priceRange.min)) {
          return false;
        }
        if (priceRange.max && gymPrice.min !== null && gymPrice.min > parseFloat(priceRange.max)) {
          return false;
        }
        return true;
      });
    }

    // Calculate distances when geolocation is enabled
    if (geolocationEnabled && location) {
      filtered = filtered.map(gym => {
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

      // Filter by distance radius
      if (distanceRadius !== null) {
        filtered = filtered.filter(gym => {
          if (gym.distance_km === null) return false;
          return gym.distance_km <= distanceRadius;
        });
      }
    }

    // Filter by favorites
    if (favoritesOnly && user) {
      filtered = filtered.filter(gym => favoriteGymIds.has(gym.id));
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-a-z':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-z-a':
          return (b.name || '').localeCompare(a.name || '');
        case 'distance-nearest':
          if (!geolocationEnabled || !location) return 0;
          const distA = a.distance_km !== null ? a.distance_km : Infinity;
          const distB = b.distance_km !== null ? b.distance_km : Infinity;
          return distA - distB;
        case 'distance-farthest':
          if (!geolocationEnabled || !location) return 0;
          const distAF = a.distance_km !== null ? a.distance_km : -Infinity;
          const distBF = b.distance_km !== null ? b.distance_km : -Infinity;
          return distBF - distAF;
        case 'price-low-high':
          const priceA = parsePriceRange(a.price_range);
          const priceB = parsePriceRange(b.price_range);
          const minA = priceA.min !== null ? priceA.min : Infinity;
          const minB = priceB.min !== null ? priceB.min : Infinity;
          return minA - minB;
        case 'price-high-low':
          const priceAMax = parsePriceRange(a.price_range);
          const priceBMax = parsePriceRange(b.price_range);
          const maxA = priceAMax.max !== null ? priceAMax.max : -Infinity;
          const maxB = priceBMax.max !== null ? priceBMax.max : -Infinity;
          return maxB - maxA;
        default:
          return 0;
      }
    });

    // Remove distance property when geolocation is disabled
    if (!geolocationEnabled || !location) {
      filtered = filtered.map(gym => {
        const { distance_km, ...gymWithoutDistance } = gym;
        return gymWithoutDistance;
      });
    }

    // Final filter: exclude hidden gyms for non-admins (double-check)
    if (!isAdmin) {
      filtered = filtered.filter(gym => !gym.is_hidden);
    }

    return filtered;
  }, [
    gyms,
    debouncedSearchTerm,
    selectedFacilities,
    isAdmin,
    selectedCountry,
    selectedCity,
    selectedDifficulties,
    priceRange,
    distanceRadius,
    favoritesOnly,
    sortBy,
    geolocationEnabled,
    location,
    user,
    favoriteGymIds
  ]);

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


  // Reset city when country changes
  useEffect(() => {
    if (selectedCountry && selectedCity && !citiesByCountry[selectedCountry]?.includes(selectedCity)) {
      setSelectedCity('');
    }
  }, [selectedCountry, selectedCity, citiesByCountry]);

  // Available cities for selected country
  const availableCities = selectedCountry ? (citiesByCountry[selectedCountry] || []) : [];

  return (
    <div className="mobile-container">

        {/* Search and Filter Controls */}
        <div className="animate-slide-up" style={{ position: 'relative', zIndex: 50 }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search gyms..."
              className="flex-1 minimal-input"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative p-1.5 hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
              aria-label="Filter gyms"
            >
              <Filter className="w-4 h-4 text-gray-400" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#087E8B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ fontSize: '10px' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
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

        {/* Saved Filter Presets */}
        {savedFilters.length > 0 && (
          <div className="mt-3 mb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {savedFilters.map((savedFilter) => (
                <button
                  key={savedFilter.id}
                  onClick={() => handleApplySavedFilter(savedFilter)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-colors flex-shrink-0 group"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#087E8B]" />
                  <span className="mobile-text-xs text-gray-300 whitespace-nowrap">{savedFilter.name}</span>
                  <button
                    onClick={(e) => handleDeleteSavedFilter(savedFilter.id, e)}
                    className="ml-1 p-0.5 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete ${savedFilter.name}`}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {(activeFilterCount > 0 || debouncedSearchTerm.trim()) && (
          <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
            {debouncedSearchTerm.trim() && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">Search: "{debouncedSearchTerm}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {selectedFacilities.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">{selectedFacilities.length} facility{selectedFacilities.length !== 1 ? 'ies' : ''}</span>
                <button
                  onClick={() => setSelectedFacilities([])}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {selectedCountry && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">{selectedCountry}</span>
                <button
                  onClick={() => { setSelectedCountry(''); setSelectedCity(''); }}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {selectedCity && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">{selectedCity}</span>
                <button
                  onClick={() => setSelectedCity('')}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {selectedDifficulties.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">{selectedDifficulties.length} difficulty{selectedDifficulties.length !== 1 ? 'ies' : ''}</span>
                <button
                  onClick={() => setSelectedDifficulties([])}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {(priceRange.min || priceRange.max) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">
                  Price: {priceRange.min || '0'}-{priceRange.max || '∞'}
                </span>
                <button
                  onClick={() => setPriceRange({ min: '', max: '' })}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {distanceRadius !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">Within {distanceRadius}km</span>
                <button
                  onClick={() => setDistanceRadius(null)}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {favoritesOnly && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700">
                <span className="mobile-text-xs text-gray-300">Favorites only</span>
                <button
                  onClick={() => setFavoritesOnly(false)}
                  className="ml-1 hover:bg-gray-700 rounded p-0.5"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 rounded-md bg-gray-800/50 border border-gray-700 hover:bg-gray-700 mobile-text-xs text-gray-300"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Result Count */}
        {!loading && (
          <div className="mt-3 mb-2">
            <p className="mobile-text-xs text-gray-400">
              {filteredGyms.length} {filteredGyms.length === 1 ? 'gym' : 'gyms'} found
            </p>
          </div>
        )}

        {/* Filter Panel - Slide-in from right */}
        {showFilters && (
          <>
            <div 
              className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowFilters(false)}
            />
            <div
              className="fixed top-0 right-0 h-full w-full max-w-sm z-[1100] bg-gray-900 shadow-2xl flex flex-col
                         transform transition-transform duration-300 ease-out animate-slide-in-right
                         md:max-w-md"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '1px solid var(--border-color)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#087E8B]" />
                  <h3 className="mobile-subheading" style={{ margin: 0 }}>Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#087E8B] text-white text-xs font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="p-4 space-y-6 pb-6">
                  {/* Sort Options */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-200">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full minimal-input text-sm"
                    >
                      <option value="name-a-z">Name (A-Z)</option>
                      <option value="name-z-a">Name (Z-A)</option>
                      {geolocationEnabled && location && (
                        <>
                          <option value="distance-nearest">Distance (Nearest)</option>
                          <option value="distance-farthest">Distance (Farthest)</option>
                        </>
                      )}
                      <option value="price-low-high">Price (Low to High)</option>
                      <option value="price-high-low">Price (High to Low)</option>
                    </select>
                  </div>

                  {/* Location Filters */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-200">Location</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1.5 text-xs text-gray-400">Country</label>
                        <select
                          value={selectedCountry}
                          onChange={(e) => {
                            setSelectedCountry(e.target.value);
                            setSelectedCity('');
                          }}
                          className="w-full minimal-input text-sm"
                        >
                          <option value="">All countries</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      {selectedCountry && availableCities.length > 0 && (
                        <div>
                          <label className="block mb-1.5 text-xs text-gray-400">City</label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full minimal-input text-sm"
                          >
                            <option value="">All cities</option>
                            {availableCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distance Radius */}
                  {geolocationEnabled && location && (
                    <div>
                      <label className="block mb-2.5 text-sm font-semibold text-gray-200">Distance</label>
                      <select
                        value={distanceRadius || ''}
                        onChange={(e) => setDistanceRadius(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full minimal-input text-sm"
                      >
                        <option value="">All distances</option>
                        <option value="5">Within 5 km</option>
                        <option value="10">Within 10 km</option>
                        <option value="25">Within 25 km</option>
                        <option value="50">Within 50 km</option>
                        <option value="100">Within 100 km</option>
                      </select>
                    </div>
                  )}

                  {/* Facilities */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-200">
                      Facilities
                      {selectedFacilities.length > 0 && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          ({selectedFacilities.length} selected)
                        </span>
                      )}
                    </label>
                    <div className="max-h-56 overflow-y-auto border border-gray-700/50 rounded-lg p-3 space-y-2.5" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      {availableFacilities.map(facility => (
                        <label key={facility} className="flex items-center gap-2.5 cursor-pointer py-1 hover:opacity-80 transition-opacity">
                          <input
                            type="checkbox"
                            checked={selectedFacilities.includes(facility)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFacilities([...selectedFacilities, facility]);
                              } else {
                                setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                            style={{ accentColor: '#087E8B' }}
                          />
                          <span className="text-sm text-gray-300 select-none">{facility}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Levels */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-200">
                      Difficulty Levels
                      {selectedDifficulties.length > 0 && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          ({selectedDifficulties.length} selected)
                        </span>
                      )}
                    </label>
                    <div className="space-y-2.5">
                      {difficultyLevels.map(level => (
                        <label key={level} className="flex items-center gap-2.5 cursor-pointer py-1 hover:opacity-80 transition-opacity">
                          <input
                            type="checkbox"
                            checked={selectedDifficulties.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDifficulties([...selectedDifficulties, level]);
                              } else {
                                setSelectedDifficulties(selectedDifficulties.filter(d => d !== level));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                            style={{ accentColor: '#087E8B' }}
                          />
                          <span className="text-sm text-gray-300 select-none">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block mb-2.5 text-sm font-semibold text-gray-200">Price Range</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="flex-1 minimal-input text-sm"
                        min="0"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="flex-1 minimal-input text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Favorites Only */}
                  {user && (
                    <div className="pt-2 border-t border-gray-700/50">
                      <label className="flex items-center gap-2.5 cursor-pointer py-1 hover:opacity-80 transition-opacity">
                        <input
                          type="checkbox"
                          checked={favoritesOnly}
                          onChange={(e) => setFavoritesOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                          style={{ accentColor: '#087E8B' }}
                        />
                        <span className="text-sm font-medium text-gray-300 select-none">Show favorites only</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700/50 flex-shrink-0 bg-gray-800/30 space-y-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full py-2.5 px-4 rounded-lg border border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-sm font-medium text-gray-300 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  onClick={() => setShowSaveFilterDialog(true)}
                  className="w-full py-2.5 px-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-sm font-medium text-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save Filter Preset
                </button>
              </div>
            </div>
          </>
        )}

        {/* Save Filter Dialog */}
        {showSaveFilterDialog && (
          <>
            <div 
              className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowSaveFilterDialog(false);
                setFilterName('');
              }}
            />
            <div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1300] bg-gray-900 rounded-lg shadow-2xl border border-gray-700/50 p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mobile-subheading mb-4" style={{ margin: 0 }}>Save Filter Preset</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">Preset Name</label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="e.g., Nearby Gyms, My Favorites"
                    className="w-full minimal-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveFilter();
                      } else if (e.key === 'Escape') {
                        setShowSaveFilterDialog(false);
                        setFilterName('');
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSaveFilterDialog(false);
                      setFilterName('');
                    }}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-600 hover:bg-gray-700 text-sm font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFilter}
                    className="flex-1 py-2 px-4 rounded-lg bg-[#087E8B] hover:bg-[#076876] text-sm font-medium text-white transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

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
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div className="text-center max-w-sm mx-auto">
                  <div className="bg-gray-800/50 w-16 h-16 rounded-full minimal-flex-center mx-auto mb-4">
                    <MapPin className="text-gray-400" size={32} />
                  </div>
                  <h3 className="mobile-subheading mb-2">No gyms found</h3>
                  <p className="mobile-text-sm text-gray-400 mb-4 leading-relaxed">
                    {activeFilterCount > 0 || debouncedSearchTerm.trim() 
                      ? "No gyms match your search and filters. Try adjusting your filters or search terms."
                      : "We couldn't find any gyms. Request to add a gym if it's missing."}
                  </p>
                  {(activeFilterCount > 0 || debouncedSearchTerm.trim()) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        clearAllFilters();
                      }}
                      className="mobile-btn-primary minimal-flex gap-2 mx-auto"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredGyms.map((gym, index) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  onOpen={openGym}
                  isAdmin={isAdmin}
                />
              ))
            )}
        </div>
      </div>
  );
}
