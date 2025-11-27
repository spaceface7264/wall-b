import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, MapPin, Calendar, MessageCircle, Building, Globe, AlertTriangle, Search, Filter, X, Sparkles, ArrowRight, ChevronDown, AlertCircle } from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import ReportCommunityModal from '../components/ReportCommunityModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../providers/ToastProvider';
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils';
import { getRecommendedCommunities } from '../../lib/recommendation-utils';
import { useGeolocation } from '../hooks/useGeolocation';
import { EmptyCommunities } from '../components/EmptyState';
import ListSkeleton from '../components/ListSkeleton';
import { useCommunities } from '../hooks/useCommunities';
import { useMyCommunities } from '../hooks/useMyCommunities';
import { useJoinCommunity, useLeaveCommunity } from '../hooks/useCommunityMutations';

export default function CommunitiesPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userIntent, setUserIntent] = useState([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState(''); // 'gym', 'general', ''
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'members', 'active', 'alphabetical'
  const [availableGyms, setAvailableGyms] = useState([]);
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Geolocation for recommendations
  const { location, requestLocation, isSupported: geolocationSupported } = useGeolocation();
  
  // React Query hooks for data fetching
  const { data: communities = [], isLoading: loading, error: communitiesError } = useCommunities(isAdmin);
  const { data: myCommunities = [], isLoading: myCommunitiesLoading } = useMyCommunities(user?.id, isAdmin);
  
  // Mutations for join/leave
  const joinMutation = useJoinCommunity(user?.id);
  const leaveMutation = useLeaveCommunity(user?.id);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          // Check if user is admin
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', user.id)
              .single();
            setIsAdmin(profile?.is_admin || false);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
          
          // Get user intent for recommendations
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_intent')
            .eq('id', user.id)
            .single();
          
          if (profile?.user_intent) {
            setUserIntent(profile.user_intent || []);
          }
          
          // Request location if supported (for location-based recommendations)
          if (geolocationSupported && !location) {
            requestLocation().catch(() => {
              // Silently fail - location is optional
            });
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
  }, []);

  // React Query will automatically refetch when isAdmin changes (via queryKey)
  
  // Load recommended communities when user and intent are available
  useEffect(() => {
    const loadRecommended = async () => {
      if (!user || !userIntent || userIntent.length === 0) {
        return;
      }
      
      setLoadingRecommended(true);
      try {
        const recommended = await getRecommendedCommunities(
          user.id,
          userIntent,
          location,
          8
        );
        setRecommendedCommunities(recommended);
      } catch (error) {
        console.error('Error loading recommended communities:', error);
      } finally {
        setLoadingRecommended(false);
      }
    };
    
    loadRecommended();
  }, [user, userIntent, location]);

  // Load gyms when gym type is selected
  useEffect(() => {
    const loadGyms = async () => {
      if (selectedType === 'gym') {
        try {
          const { data: gyms, error } = await supabase
            .from('gyms')
            .select('id, name, country, city')
            .eq('is_hidden', false)
            .order('name', { ascending: true });
          
          if (error) {
            console.error('Error loading gyms:', error);
            setAvailableGyms([]);
          } else {
            // Filter by country if selected
            let filteredGyms = gyms || [];
            if (selectedCountry) {
              filteredGyms = filteredGyms.filter(gym => gym.country === selectedCountry);
            }
            setAvailableGyms(filteredGyms);
          }
        } catch (error) {
          console.error('Error loading gyms:', error);
          setAvailableGyms([]);
        }
      } else {
        setAvailableGyms([]);
      }
    };
    
    loadGyms();
  }, [selectedType, selectedCountry]);

  // React Query handles refetching automatically - no need for manual focus handler
  // Data fetching is now handled by useCommunities() and useMyCommunities() hooks

  // Combine all communities (my communities, recommended, and all others) into one list
  const allCommunities = useMemo(() => {
    const combined = [...communities];
    
    // Add my communities if they're not already in the list
    // Filter out suspended for non-admins
    myCommunities.forEach(myComm => {
      if ((isAdmin || myComm.is_active !== false) && !combined.find(c => c.id === myComm.id)) {
        combined.push(myComm);
      }
    });
    
    // Add recommended communities if they're not already in the list
    // Filter out suspended for non-admins
    recommendedCommunities.forEach(recComm => {
      if ((isAdmin || recComm.is_active !== false) && !combined.find(c => c.id === recComm.id)) {
        combined.push(recComm);
      }
    });
    
    // Final filter to ensure no suspended communities slip through for non-admins
    return isAdmin 
      ? combined 
      : combined.filter(c => c.is_active !== false);
  }, [communities, myCommunities, recommendedCommunities, isAdmin]);
  
  // Get unique countries and cities from all communities
  const availableCountries = useMemo(() => {
    const countries = new Set();
    allCommunities.forEach(community => {
      const gymData = community.gyms 
        ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
        : null;
      if (gymData?.country) {
        countries.add(gymData.country);
      }
    });
    return Array.from(countries).sort();
  }, [allCommunities]);
  
  const availableCities = useMemo(() => {
    const cities = new Set();
    allCommunities.forEach(community => {
      const gymData = community.gyms 
        ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
        : null;
      if (gymData?.city) {
        cities.add(gymData.city);
      }
    });
    return Array.from(cities).sort();
  }, [allCommunities]);
  
  // Filter and sort communities
  const filteredCommunities = useMemo(() => {
    let filtered = allCommunities.filter(community => {
      // Safety checks
      if (!community || !community.name) {
        return false;
      }
      // Hide suspended communities from explore view for non-admins
      // Admins can see them to manage them
      if (!isAdmin && community.is_active === false) {
        return false;
      }
      return true;
    });
    
    // Search filter
    if (debouncedSearchQuery.trim()) {
      const searchLower = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(community => {
        const nameMatch = community.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = community.description?.toLowerCase().includes(searchLower);
        
        // Search in gym data
        const gymData = community.gyms 
          ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
          : null;
        const gymNameMatch = gymData?.name?.toLowerCase().includes(searchLower);
        const cityMatch = gymData?.city?.toLowerCase().includes(searchLower);
        const countryMatch = gymData?.country?.toLowerCase().includes(searchLower);
        
        return nameMatch || descriptionMatch || gymNameMatch || cityMatch || countryMatch;
      });
    }
    
    // Type filter
    if (selectedType) {
      filtered = filtered.filter(community => {
        if (selectedType === 'gym') {
          return community.gym_id || (community.gyms && community.gyms.length > 0) || community.community_type === 'gym';
        }
        if (selectedType === 'general') {
          return community.community_type === 'general' || (!community.gym_id && !community.gyms);
        }
        return true;
      });
    }
    
    // Gym filter (only for gym-based communities)
    if (selectedType === 'gym' && selectedGym) {
      filtered = filtered.filter(community => {
        return community.gym_id === selectedGym;
      });
    }
    
    // Category filter (only for general communities)
    if (selectedType === 'general' && selectedCategory) {
      // Note: This would require checking posts in the community
      // For now, we'll skip this filter as it requires additional queries
      // You can implement this later if needed
    }
    
    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(community => {
        // For gym-based communities, check gym country
        if (selectedType === 'gym' || community.gym_id || community.gyms) {
          const gymData = community.gyms 
            ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
            : null;
          return gymData?.country === selectedCountry;
        }
        // For general communities, we might need to check if they have location data
        // For now, if no gym data, skip country filter for general communities
        return true;
      });
    }
    
    // City filter (only for gym-based communities)
    if (selectedType === 'gym' && selectedCity) {
      filtered = filtered.filter(community => {
        const gymData = community.gyms 
          ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
          : null;
        return gymData?.city === selectedCity;
      });
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'members':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'active':
          const aPosts = a.post_count || a.posts_count || 0;
          const bPosts = b.post_count || b.posts_count || 0;
          return bPosts - aPosts;
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');
        case 'newest':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });
    
    return filtered;
  }, [allCommunities, debouncedSearchQuery, selectedType, selectedCountry, selectedCity, selectedGym, selectedCategory, sortBy, isAdmin]);
  
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedGym('');
    setSelectedCategory('');
    setSortBy('newest');
  }, []);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedCountry) count++;
    if (selectedCity) count++;
    if (selectedGym) count++;
    if (selectedCategory) count++;
    return count;
  }, [selectedType, selectedCountry, selectedCity, selectedGym, selectedCategory]);
  
  // Helper function to check if community is new (< 7 days old)
  const isNewCommunity = useCallback((community) => {
    if (!community.created_at) return false;
    const createdDate = new Date(community.created_at);
    const now = new Date();
    const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
    return daysDiff < 7;
  }, []);

  // Track which community is being joined/left for loading states
  const [joiningCommunityId, setJoiningCommunityId] = useState(null);
  const [leavingCommunityId, setLeavingCommunityId] = useState(null);

  const handleJoinCommunity = async (communityId) => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to join communities');
      return;
    }

    setJoiningCommunityId(communityId);
    joinMutation.mutate(communityId, {
      onSuccess: () => {
        setJoiningCommunityId(null);
        showToast('success', 'Success', 'Joined community successfully!');
        
        // Remove from recommended if it was there
        setRecommendedCommunities(prev => prev.filter(c => c.id !== communityId));
        
        // Reload recommendations to get fresh suggestions
        if (userIntent && userIntent.length > 0) {
          getRecommendedCommunities(
            user.id,
            userIntent,
            location,
            8
          ).then(recommended => {
            setRecommendedCommunities(recommended);
          }).catch(error => {
            console.error('Error reloading recommended communities:', error);
          });
        }
      },
      onError: (error) => {
        setJoiningCommunityId(null);
        console.error('Error joining community:', error);
        showToast('error', 'Error', 'Failed to join community');
      },
    });
  };


  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommunity, setReportingCommunity] = useState(null);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleLeaveCommunity = async (communityId) => {
    if (!user) {
      return;
    }

    setLeavingCommunityId(communityId);
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async () => {
    if (!user || !leavingCommunityId) {
      return;
    }

    leaveMutation.mutate(leavingCommunityId, {
      onSuccess: () => {
        showToast('success', 'Success', 'You have left the community');
        setLeavingCommunityId(null);
        setShowLeaveModal(false);
      },
      onError: (error) => {
        console.error('Error leaving community:', error);
        let errorMessage = 'Failed to leave community';
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please ensure the RLS policy allows users to leave communities. Run the SQL script: fix-leave-community-policy.sql';
        } else if (error.message) {
          errorMessage = `Failed to leave community: ${error.message}`;
        }
        showToast('error', 'Error', errorMessage);
        setLeavingCommunityId(null);
        setShowLeaveModal(false);
      },
    });
  };

  const handleReportCommunity = async (communityId) => {
    const community = allCommunities.find(c => c.id === communityId);
    setReportingCommunity({ id: communityId, name: community?.name || 'Community' });
    setShowReportModal(true);
  };

  const handleReportModalClose = (success) => {
    setShowReportModal(false);
    setReportingCommunity(null);
    if (success) {
      showToast('success', 'Report Submitted', 'Thank you for reporting. Admins will review this community.');
    }
  };

  if (loading) {
    return (
        <div className="mobile-container">
          <div className="mobile-section">
            <ListSkeleton variant="community" count={6} />
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Search Bar */}
          <div className="animate-slide-up mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Create Community Button - Only show if authenticated */}
          {user && (
            <div className="animate-slide-up mb-4">
              <button
                onClick={() => navigate('/community/new')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-800/30 hover:bg-gray-700/50 text-gray-300 border border-gray-700 rounded-lg transition-colors text-sm font-normal"
              >
                <Plus className="w-4 h-4" />
                Create Community
              </button>
            </div>
          )}

          {/* Filter and Sort Controls */}
          <div className="animate-slide-up mb-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#2663EB]/20 text-[#2663EB] border border-[#2663EB]/30'
                  : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#2663EB] text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="newest">Newest</option>
              <option value="members">Most Members</option>
              <option value="active">Most Active</option>
              <option value="alphabetical">A-Z</option>
            </select>

            {(activeFilterCount > 0 || searchQuery.trim()) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="animate-slide-up mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="space-y-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Type
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['', 'gym', 'general'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type === selectedType ? '' : type);
                          // Clear dependent filters when type changes
                          if (type !== selectedType) {
                            setSelectedGym('');
                            setSelectedCategory('');
                            setSelectedCity('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedType === type
                            ? 'bg-[#2663EB] text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {type === '' ? 'All' : type === 'gym' ? 'Gym-based' : 'No home'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Filter - Only shown when a type is selected */}
                {selectedType && availableCountries.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        setSelectedCity(''); // Reset city when country changes
                        setSelectedGym(''); // Reset gym when country changes
                      }}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="">All Countries</option>
                      {availableCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Gym Filter - Only for gym-based communities */}
                {selectedType === 'gym' && availableGyms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Gym
                    </label>
                    <select
                      value={selectedGym}
                      onChange={(e) => setSelectedGym(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="">All Gyms</option>
                      {availableGyms.map((gym) => (
                        <option key={gym.id} value={gym.id}>
                          {gym.name} {gym.city ? `(${gym.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* City Filter - Only for gym-based communities */}
                {selectedType === 'gym' && availableCities.length > 0 && selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      City
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="">All Cities</option>
                      {availableCities
                        .filter(city => {
                          // Only show cities from selected country
                          return allCommunities.some(community => {
                            const gymData = community.gyms 
                              ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
                              : null;
                            return gymData?.city === city && gymData?.country === selectedCountry;
                          });
                        })
                        .map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Category Filter - Only for general (no home) communities */}
                {selectedType === 'general' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2663EB] focus:border-transparent"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="">All Categories</option>
                      <option value="beta">Beta</option>
                      <option value="event">Event</option>
                      <option value="question">Question</option>
                      <option value="gear">Gear</option>
                      <option value="training">Training</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(activeFilterCount > 0 || searchQuery.trim()) && (
            <div className="animate-slide-up mb-4 flex items-center gap-2 flex-wrap text-sm text-gray-400">
              {searchQuery.trim() && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedType && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  Type: {selectedType === 'gym' ? 'Gym-based' : 'No home'}
                </span>
              )}
              {selectedGym && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  Gym: {availableGyms.find(g => g.id === selectedGym)?.name || selectedGym}
                </span>
              )}
              {selectedCategory && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  Category: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                </span>
              )}
              {selectedCountry && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  Country: {selectedCountry}
                </span>
              )}
              {selectedCity && (
                <span className="px-2 py-1 bg-gray-800/50 rounded text-xs">
                  City: {selectedCity}
                </span>
              )}
            </div>
          )}

          {/* All Communities - Unified List */}
          <div className="animate-slide-up mt-6">
            {communitiesError ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-400 mb-2">Failed to load communities</p>
                <p className="text-gray-400 text-sm">{communitiesError.message || 'Please try again later'}</p>
              </div>
            ) : filteredCommunities.length === 0 ? (
              <EmptyCommunities 
                onCreateClick={() => navigate('/community/new')}
                searchQuery={searchQuery}
                hasActiveFilters={activeFilterCount > 0}
                onClearFilters={clearFilters}
              />
            ) : (
              <div className="-mx-4 md:-mx-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                <div className="px-3 desktop-grid-3">
                {filteredCommunities.map((community) => {
                  // Check if user is a member
                  const isMember = myCommunities.some(c => c.id === community.id);
                  const isSuspended = community.is_active === false;
                  
                  return (
                    <div
                      key={community.id}
                      className="rounded-lg transition-all duration-200 cursor-pointer relative flex flex-col"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: isSuspended ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-color)',
                        padding: 'var(--card-padding-mobile)',
                        opacity: isSuspended ? 0.7 : 1,
                        minHeight: '100%',
                        height: '100%'
                      }}
                      onClick={() => navigate(`/community/${community.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isSuspended ? 'rgba(239, 68, 68, 0.05)' : 'var(--hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      }}
                    >
                      {/* Suspended Banner - Top of Card */}
                      {isSuspended && (
                        <div className="absolute top-0 left-0 right-0 z-20 bg-red-500/20 border-b border-red-500/40 px-3 py-1.5 flex items-center gap-2 rounded-t-lg" onClick={(e) => e.stopPropagation()}>
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-red-300">Suspended</span>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col" style={{ marginTop: isSuspended ? '32px' : '0', minHeight: 0 }}>
                        <CommunityCard
                          community={community}
                          isMember={isMember}
                          onJoin={handleJoinCommunity}
                          onLeave={handleLeaveCommunity}
                          onReport={handleReportCommunity}
                          onOpen={() => navigate(`/community/${community.id}`)}
                          joining={joiningCommunityId === community.id}
                          leaving={leavingCommunityId === community.id}
                        />
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && reportingCommunity && (
        <ReportCommunityModal
          isOpen={showReportModal}
          onClose={handleReportModalClose}
          communityId={reportingCommunity.id}
          communityName={reportingCommunity.name}
        />
      )}

      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setLeavingCommunityId(null);
        }}
        onConfirm={handleConfirmLeave}
        title="Leave Community"
        message="Are you sure you want to leave this community? You will no longer be able to see posts or participate in discussions."
        confirmText="Leave"
        cancelText="Cancel"
        icon={AlertTriangle}
        variant="warning"
      />
    </>
  );
}

