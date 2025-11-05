import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, MapPin, Calendar, MessageCircle, Building, Globe, AlertTriangle, Search, Filter, X, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import ReportCommunityModal from '../components/ReportCommunityModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../providers/ToastProvider';
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils';
import { getRecommendedCommunities } from '../../lib/recommendation-utils';
import { useGeolocation } from '../hooks/useGeolocation';
import { EmptyCommunities } from '../components/EmptyState';
import ListSkeleton from '../components/ListSkeleton';

export default function CommunitiesPage() {
  const [user, setUser] = useState(null);
  const [userIntent, setUserIntent] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myCommunities, setMyCommunities] = useState([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState(''); // 'gym', 'location', 'online', ''
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'members', 'active', 'alphabetical'
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Geolocation for recommendations
  const { location, requestLocation, isSupported: geolocationSupported } = useGeolocation();

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
          loadMyCommunities(user.id);
          
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
    loadCommunities();
  }, []);
  
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

  // Reload communities when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      loadCommunities();
      if (user) {
        loadMyCommunities(user.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      
      // First try with gyms relation
      // Filter out suspended communities (is_active = false)
      let { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address,
            image_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // If that fails (e.g., RLS issue with gyms), try without gyms relation
      if (error) {
        console.warn('Error loading communities with gyms relation:', error);
        console.log('Retrying without gyms relation...');
        
        const fallbackResult = await supabase
          .from('communities')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (fallbackResult.error) {
          console.error('Error loading communities:', fallbackResult.error);
          showToast('error', 'Error', `Failed to load communities: ${fallbackResult.error.message}`);
          return;
        }
        
        data = fallbackResult.data;
        error = null;
        
        // Fetch gym data separately for communities that have gym_id
        if (data && data.length > 0) {
          const gymIds = data
            .map(c => c.gym_id)
            .filter(Boolean)
            .filter((id, index, self) => self.indexOf(id) === index); // unique IDs
          
          if (gymIds.length > 0) {
            console.log('Fetching gym data for', gymIds.length, 'gyms:', gymIds);
            
            // Try fetching gyms one by one if batch fails (RLS might block .in())
            let gymsMap = {};
            
            // First try batch query
            const { data: gymsData, error: gymsError } = await supabase
              .from('gyms')
              .select('id, name, city, country, address')
              .in('id', gymIds);
            
            if (gymsError) {
              console.warn('Batch gym query failed, trying individual queries:', gymsError);
              console.error('Full error details:', JSON.stringify(gymsError, null, 2));
              
              // Fallback: fetch gyms individually
              for (const gymId of gymIds) {
                try {
                  console.log('Fetching individual gym:', gymId);
                  const { data: gymData, error: singleError } = await supabase
                    .from('gyms')
                    .select('id, name, city, country, address')
                    .eq('id', gymId)
                    .single();
                  
                  if (singleError) {
                    console.error(`Failed to fetch gym ${gymId}:`, singleError);
                  } else if (gymData) {
                    console.log('✅ Successfully fetched gym:', gymData.name);
                    gymsMap[gymData.id] = gymData;
                  }
                } catch (err) {
                  console.error('Exception fetching gym', gymId, err);
                }
              }
            } else if (gymsData) {
              // Batch query succeeded
              gymsData.forEach(gym => {
                gymsMap[gym.id] = gym;
              });
            }
            
            // Attach gym data to communities
            if (Object.keys(gymsMap).length > 0) {
              data = data.map(community => {
                const gym = community.gym_id && gymsMap[community.gym_id] ? gymsMap[community.gym_id] : null;
                return {
                  ...community,
                  gyms: gym ? [gym] : undefined
                };
              });
              
              console.log('Attached gym data to communities:', data.filter(c => c.gyms).length, 'communities have gym data');
            } else {
              console.warn('No gym data fetched for any communities');
            }
          }
        }
      }

      if (error) {
        console.error('Error loading communities:', error);
        showToast('error', 'Error', `Failed to load communities: ${error.message}`);
        return;
      }

      console.log('Loaded communities:', data?.length || 0, data);

      // Enrich communities with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(data || []);
      console.log('Enriched communities:', enrichedCommunities?.length || 0, enrichedCommunities);
      setCommunities(enrichedCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCommunities = async (userId) => {
    try {
      // Try with nested gyms relation first
      let { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities (
            id,
            name,
            description,
            community_type,
            member_count,
            created_at,
            gym_id,
            gyms (
              name,
              city,
              country,
              image_url
            )
          )
        `)
        .eq('user_id', userId);

      // If nested query fails, fetch communities separately
      if (error) {
        console.warn('Error loading my communities with nested gyms:', error);
        
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', userId);

        if (membersError) {
          console.error('Error loading my communities:', membersError);
          return;
        }

        const communityIds = membersData?.map(m => m.community_id).filter(Boolean) || [];
        if (communityIds.length === 0) {
          setMyCommunities([]);
          return;
        }

        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, description, community_type, member_count, created_at, gym_id')
          .in('id', communityIds);

        if (communitiesError) {
          console.error('Error loading communities:', communitiesError);
          return;
        }

        data = communitiesData?.map(c => ({ community_id: c.id, communities: c })) || [];
        
        // Fetch gym data separately
        const gymIds = communitiesData
          ?.map(c => c.gym_id)
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index) || [];
        
        if (gymIds.length > 0) {
          console.log('Fetching gym data for my communities:', gymIds.length, 'gyms');
          
          // Try fetching gyms one by one if batch fails (RLS might block .in())
          let gymsMap = {};
          
          // First try batch query
          const { data: gymsData, error: gymsError } = await supabase
            .from('gyms')
            .select('id, name, city, country')
            .in('id', gymIds);
          
          if (gymsError) {
            console.warn('Batch gym query failed for my communities, trying individual queries:', gymsError);
            
            // Fallback: fetch gyms individually
            for (const gymId of gymIds) {
              try {
                const { data: gymData, error: singleError } = await supabase
                  .from('gyms')
                  .select('id, name, city, country')
                  .eq('id', gymId)
                  .single();
                
                if (!singleError && gymData) {
                  gymsMap[gymData.id] = gymData;
                }
              } catch (err) {
                console.warn('Failed to fetch gym', gymId, err);
              }
            }
          } else if (gymsData) {
            // Batch query succeeded
            gymsData.forEach(gym => {
              gymsMap[gym.id] = gym;
            });
          }
          
          // Attach gym data to communities
          if (Object.keys(gymsMap).length > 0) {
            data = data.map(item => {
              const gym = item.communities.gym_id && gymsMap[item.communities.gym_id] 
                ? gymsMap[item.communities.gym_id] 
                : null;
              return {
                ...item,
                communities: {
                  ...item.communities,
                  gyms: gym ? [gym] : undefined
                }
              };
            });
          }
        }
      }

      const myCommunitiesList = data?.map(item => item.communities).filter(Boolean) || [];
      // Enrich with actual member counts
      const enrichedMyCommunities = await enrichCommunitiesWithActualCounts(myCommunitiesList);
      setMyCommunities(enrichedMyCommunities);
    } catch (error) {
      console.error('Error loading my communities:', error);
    }
  };

  // Combine all communities (my communities, recommended, and all others) into one list
  const allCommunities = useMemo(() => {
    const combined = [...communities];
    
    // Add my communities if they're not already in the list
    myCommunities.forEach(myComm => {
      if (!combined.find(c => c.id === myComm.id)) {
        combined.push(myComm);
      }
    });
    
    // Add recommended communities if they're not already in the list
    recommendedCommunities.forEach(recComm => {
      if (!combined.find(c => c.id === recComm.id)) {
        combined.push(recComm);
      }
    });
    
    return combined;
  }, [communities, myCommunities, recommendedCommunities]);
  
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
      return true; // Include all communities now
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
          return community.gym_id || (community.gyms && community.gyms.length > 0);
        }
        if (selectedType === 'location') {
          return community.community_type === 'location';
        }
        if (selectedType === 'online') {
          return community.community_type === 'online';
        }
        return true;
      });
    }
    
    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(community => {
        const gymData = community.gyms 
          ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
          : null;
        return gymData?.country === selectedCountry;
      });
    }
    
    // City filter
    if (selectedCity) {
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
  }, [allCommunities, debouncedSearchQuery, selectedType, selectedCountry, selectedCity, sortBy]);
  
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedCountry('');
    setSelectedCity('');
    setSortBy('newest');
  }, []);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedCountry) count++;
    if (selectedCity) count++;
    return count;
  }, [selectedType, selectedCountry, selectedCity]);
  
  // Helper function to check if community is new (< 7 days old)
  const isNewCommunity = useCallback((community) => {
    if (!community.created_at) return false;
    const createdDate = new Date(community.created_at);
    const now = new Date();
    const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
    return daysDiff < 7;
  }, []);

  const [joiningCommunity, setJoiningCommunity] = useState(null);
  const [leavingCommunity, setLeavingCommunity] = useState(null);

  const handleJoinCommunity = async (communityId) => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to join communities');
      return;
    }

    setJoiningCommunity(communityId);
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id
        });

      if (error) {
        console.error('Error joining community:', error);
        showToast('error', 'Error', 'Failed to join community');
        return;
      }

      showToast('success', 'Success', 'Joined community successfully!');
      
      // Remove from recommended if it was there
      setRecommendedCommunities(prev => prev.filter(c => c.id !== communityId));
      
      await loadCommunities();
      if (user) {
        await loadMyCommunities(user.id);
        
        // Reload recommendations to get fresh suggestions
        if (userIntent && userIntent.length > 0) {
          try {
            const recommended = await getRecommendedCommunities(
              user.id,
              userIntent,
              location,
              8
            );
            setRecommendedCommunities(recommended);
          } catch (error) {
            console.error('Error reloading recommended communities:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error joining community:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setJoiningCommunity(null);
    }
  };


  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommunity, setReportingCommunity] = useState(null);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leavingCommunityId, setLeavingCommunityId] = useState(null);

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

    setLeavingCommunity(leavingCommunityId);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', leavingCommunityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        showToast('error', 'Error', 'Failed to leave community');
        return;
      }

      showToast('success', 'Success', 'You have left the community');
      await loadCommunities();
      if (user) {
        await loadMyCommunities(user.id);
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setLeavingCommunity(null);
      setLeavingCommunityId(null);
    }
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
          <div className="animate-slide-up mt-6 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
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

          {/* Filter and Sort Controls */}
          <div className="animate-slide-up mb-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#087E8B]/20 text-[#087E8B] border border-[#087E8B]/30'
                  : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#087E8B] text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
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
                    {['', 'gym', 'location', 'online'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type === selectedType ? '' : type)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedType === type
                            ? 'bg-[#087E8B] text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {type === '' ? 'All' : type === 'gym' ? 'Gym-based' : type === 'location' ? 'Location-based' : 'Online'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Filter */}
                {availableCountries.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        setSelectedCity(''); // Reset city when country changes
                      }}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
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

                {/* City Filter */}
                {availableCities.length > 0 && selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      City
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
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
                  Type: {selectedType === 'gym' ? 'Gym-based' : selectedType === 'location' ? 'Location-based' : 'Online'}
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
            {filteredCommunities.length === 0 ? (
              <EmptyCommunities onCreateClick={() => navigate('/community/new')} />
            ) : (
              <div className="-mx-4 md:-mx-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                <div className="px-3 desktop-grid-3">
                {filteredCommunities.map((community) => {
                  // Check if user is a member
                  const isMember = myCommunities.some(c => c.id === community.id);
                  
                  return (
                    <div
                      key={community.id}
                      className="rounded-lg transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        padding: 'var(--card-padding-mobile)'
                      }}
                      onClick={() => navigate(`/community/${community.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      }}
                    >
                  <CommunityCard
                    community={community}
                    isMember={isMember}
                    onJoin={handleJoinCommunity}
                    onLeave={handleLeaveCommunity}
                    onReport={handleReportCommunity}
                    onOpen={() => navigate(`/community/${community.id}`)}
                    joining={joiningCommunity === community.id}
                    leaving={leavingCommunity === community.id}
                  />
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
