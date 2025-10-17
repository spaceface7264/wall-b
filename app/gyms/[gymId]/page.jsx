'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { MapPin, Clock, Phone, Mail, Globe, Star, Heart, Dumbbell, Users, Calendar, Info, MessageCircle, Plus } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import TabNavigation from '../../components/TabNavigation';
import CalendarView from '../../components/CalendarView';
import { useToast } from '../../providers/ToastProvider';

export default function GymDetail() {
  const [gym, setGym] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();

  const tabs = [
    { id: 'about', label: 'About', icon: Info },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar }
  ];

  useEffect(() => {
    getUser();
    if (params.gymId) {
      fetchGym(params.gymId);
    }
  }, [params.gymId]);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user && params.gymId) {
        await checkFavoriteStatus(user.id, params.gymId);
      }
    } catch (error) {
      console.log('Error getting user:', error);
    }
  };

  const checkFavoriteStatus = async (userId, gymId) => {
    try {
      const { data: favorite, error } = await supabase
        .from('user_favorite_gyms')
        .select('id')
        .eq('user_id', userId)
        .eq('gym_id', gymId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error checking favorite status:', error);
        return;
      }

      setIsFavorite(!!favorite);
    } catch (error) {
      console.log('Error checking favorite status:', error);
    }
  };

  const fetchGym = async (gymId) => {
    try {
      setLoading(true);
      console.log('Fetching gym with ID:', gymId);
      
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

      if (error) {
        console.error('Error fetching gym from database:', error);
        // Fallback to mock data
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
            image_url: "https://images.unsplash.com/photo-1544551763-46a013bbd26?w=800",
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
            difficulty_levels: ["Beginner", "Intermediate", "Advanced", "Expert"],
            wall_height: "4-5 meters",
            boulder_count: 200
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
            difficulty_levels: ["Beginner", "Intermediate", "Advanced", "Expert", "Competition"],
            wall_height: "4-6 meters",
            boulder_count: 300
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
            difficulty_levels: ["Beginner", "Intermediate", "Advanced"],
            wall_height: "3.5-5 meters",
            boulder_count: 150
          }
        ];
        
        const foundGym = mockGyms.find(gym => gym.id === gymId);
        if (foundGym) {
          setGym(foundGym);
          await loadCommunities(foundGym.id);
          await loadEvents(foundGym.id);
        } else {
          setGym(null);
        }
      } else {
        setGym(data);
        await loadCommunities(data.id);
        await loadEvents(data.id);
      }
    } catch (error) {
      console.error('Error fetching gym:', error);
      setGym(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async (gymId) => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('gym_id', gymId)
        .eq('community_type', 'gym');

      if (error) {
        console.log('Error loading communities, showing empty state');
        setCommunities([]);
        return;
      }

      setCommunities(data || []);
    } catch (error) {
      console.log('Error loading communities, showing empty state');
      setCommunities([]);
    }
  };

  const loadEvents = async (gymId) => {
    try {
      // First, get communities for this gym
      const { data: communities, error: communitiesError } = await supabase
        .from('communities')
        .select('id')
        .eq('gym_id', gymId);

      if (communitiesError) {
        console.error('Error loading communities for events:', communitiesError);
        setEvents([]);
        return;
      }

      if (!communities || communities.length === 0) {
        setEvents([]);
        return;
      }

      // Then get events for those communities
      const communityIds = communities.map(c => c.id);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles(full_name)
        `)
        .in('community_id', communityIds)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to save favorites');
      return;
    }

    if (!gym || !gym.id) {
      console.error('No gym data available:', gym);
      showToast('error', 'Error', 'Gym information not available');
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        const { data, error } = await supabase
          .from('user_favorite_gyms')
          .delete()
          .eq('user_id', user.id)
          .eq('gym_id', gym.id)
          .select();

        if (error) {
          console.error('Error removing favorite:', error);
          if (error.message.includes('invalid input syntax for type uuid')) {
            showToast('error', 'Authentication Error', 'Please log in to manage favorites');
          } else {
            showToast('error', 'Error', `Failed to remove from favorites: ${error.message}`);
          }
          return;
        }

        setIsFavorite(false);
        showToast('success', 'Removed', 'Gym removed from favorites');
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('user_favorite_gyms')
          .insert({
            user_id: user.id,
            gym_id: gym.id
          })
          .select();

        if (error) {
          console.error('Error adding favorite:', error);
          if (error.message.includes('invalid input syntax for type uuid')) {
            showToast('error', 'Authentication Error', 'Please log in to save favorites');
          } else {
            showToast('error', 'Error', `Failed to add to favorites: ${error.message}`);
          }
          return;
        }

        setIsFavorite(true);
        showToast('success', 'Added!', 'Gym added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
    }
  };

  const joinCommunity = async (communityId) => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to join communities');
      return;
    }

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

      showToast('success', 'Joined!', 'You have joined the community');
      loadCommunities(gym.id); // Reload communities
    } catch (error) {
      console.error('Error joining community:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };

  const getFacilityIcon = (facility) => {
    const iconMap = {
      'Cafe': Globe,
      'Shop': Globe,
      'Training Area': Dumbbell,
      'Yoga Studio': Users,
      'Kids Area': Users,
      'Locker Rooms': Shield,
      'Parking': MapPin,
      'Equipment Rental': Globe,
      'Sauna': Shield,
      'Massage': Shield,
      'Bike Storage': MapPin
    };
    return iconMap[facility] || Globe;
  };

  const formatOpeningHours = (hours) => {
    if (!hours) return 'Hours not available';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => {
      const isToday = new Date().getDay() === (index + 1) % 7;
      const isClosed = !hours[day] || hours[day] === 'Closed';
      
      return (
        <div key={day} className={`minimal-flex-between py-2 px-2 rounded ${isToday ? 'bg-indigo-900/30' : ''}`}>
          <span className={`minimal-text text-sm ${isToday ? 'text-indigo-400 font-medium' : ''}`}>
            {dayNames[index]}:
          </span>
          <span className={`minimal-text text-sm ${isClosed ? 'text-gray-500' : isToday ? 'text-indigo-400 font-medium' : 'text-gray-300'}`}>
            {hours[day] || 'Closed'}
          </span>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="gyms" pageTitle={gym?.name}>
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card animate-fade-in">
              <div className="minimal-flex-center py-8">
                <div className="minimal-spinner"></div>
                <p className="minimal-text ml-3">Loading gym details...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!gym) {
    return (
      <SidebarLayout currentPage="gyms" pageTitle={gym?.name}>
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <MapPin className="minimal-icon mx-auto mb-2 text-gray-500" />
                  <p className="mobile-text-sm">Gym not found</p>
                  <button 
                    onClick={() => router.back()}
                    className="mobile-btn-primary mt-4"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-6">
            {/* Gym Image */}
            <div className="w-full h-64 bg-gray-700 rounded-xl overflow-hidden elevation-2">
              <img 
                src={gym.image_url} 
                alt={gym.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full minimal-flex-center bg-gray-700" style={{display: 'none'}}>
                <MapPin className="minimal-icon text-gray-400 text-5xl" />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mobile-card-flat p-4">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <MapPin className="minimal-icon mr-2 text-indigo-400" />
                  Location
                </h4>
                <div className="space-y-3">
                  <div className="minimal-flex">
                    <span className="minimal-text text-sm">{gym.address}</span>
                  </div>
                  <div className="minimal-flex">
                    <span className="minimal-text text-sm">{gym.city}, {gym.country}</span>
                  </div>
                </div>
              </div>

              <div className="mobile-card-flat p-4">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Phone className="minimal-icon mr-2 text-indigo-400" />
                  Contact
                </h4>
                <div className="space-y-3">
                  {gym.phone && (
                    <div className="minimal-flex">
                      <Phone className="minimal-icon mr-3 text-gray-400" />
                      <a href={`tel:${gym.phone}`} className="minimal-text text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        {gym.phone}
                      </a>
                    </div>
                  )}
                  {gym.email && (
                    <div className="minimal-flex">
                      <Mail className="minimal-icon mr-3 text-gray-400" />
                      <a href={`mailto:${gym.email}`} className="minimal-text text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        {gym.email}
                      </a>
                    </div>
                  )}
                  {gym.website && (
                    <div className="minimal-flex">
                      <Globe className="minimal-icon mr-3 text-gray-400" />
                      <a href={gym.website} target="_blank" rel="noopener noreferrer" className="minimal-text text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mobile-card-flat p-4">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Star className="minimal-icon mr-2 text-indigo-400" />
                About
              </h4>
              <p className="minimal-text text-sm text-gray-300 leading-relaxed">{gym.description}</p>
            </div>

            {/* Facilities */}
            <div className="mobile-card-flat p-4">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Dumbbell className="minimal-icon mr-2 text-indigo-400" />
                Facilities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]')).map((facility, index) => {
                  const IconComponent = getFacilityIcon(facility);
                  return (
                    <div key={index} className="minimal-flex mobile-text-sm bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                      <IconComponent className="w-4 h-4 mr-2 text-indigo-400" />
                      {facility}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gym Details & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mobile-card-flat p-4">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Dumbbell className="minimal-icon mr-2 text-indigo-400" />
                  Gym Details
                </h4>
                <div className="space-y-3">
                  <div className="minimal-flex-between">
                    <span className="minimal-text text-sm">Price Range:</span>
                    <span className="minimal-text text-sm font-medium text-indigo-400">{gym.price_range}</span>
                  </div>
                  <div className="minimal-flex-between">
                    <span className="minimal-text text-sm">Wall Height:</span>
                    <span className="minimal-text text-sm">{gym.wall_height}</span>
                  </div>
                  <div className="minimal-flex-between">
                    <span className="minimal-text text-sm">Boulder Problems:</span>
                    <span className="minimal-text text-sm">{gym.boulder_count}</span>
                  </div>
                  <div className="minimal-flex-between">
                    <span className="minimal-text text-sm">Difficulty Levels:</span>
                    <span className="minimal-text text-sm">{(Array.isArray(gym.difficulty_levels) ? gym.difficulty_levels : JSON.parse(gym.difficulty_levels || '[]')).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="mobile-card-flat p-4">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Clock className="minimal-icon mr-2 text-indigo-400" />
                  Opening Hours
                </h4>
                <div className="space-y-2">
                  {formatOpeningHours(gym.opening_hours)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {gym.website && (
                <a
                  href={gym.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 mobile-btn-primary text-center"
                >
                  <Globe className="minimal-icon mr-2" />
                  Visit Website
                </a>
              )}
              {gym.phone && (
                <a
                  href={`tel:${gym.phone}`}
                  className="flex-1 mobile-btn-secondary text-center"
                >
                  <Phone className="minimal-icon mr-2" />
                  Call Now
                </a>
              )}
            </div>
          </div>
        );

      case 'communities':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Communities at this gym</h3>
              <span className="text-sm text-gray-400">{communities.length} communities</span>
            </div>
            
            {communities.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No communities yet at this gym</p>
                <button className="mobile-btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {communities.map((community) => (
                  <div key={community.id} className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{community.name}</h4>
                        <p className="text-sm text-gray-300 mt-1">{community.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.member_count || 0} members
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => joinCommunity(community.id)}
                          className="mobile-btn-primary"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'events':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Events at this gym</h3>
              <span className="text-sm text-gray-400">{events.length} events</span>
            </div>
            
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No events scheduled at this gym</p>
              </div>
            ) : (
              <CalendarView communityId={gym.id} userId={user?.id} />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarLayout currentPage="gyms">
      <div className="mobile-container">
        {/* Tab Navigation - Moved to top */}
        <div className="animate-slide-up">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <div className="mobile-section">
          {/* Header with Title and Favorite */}
          <div className="mobile-card animate-fade-in mb-6">
            <div className="minimal-flex-between items-start">
              <div className="flex-1">
                <div className="minimal-flex-between items-center mb-2">
                  <h1 className="mobile-card-title text-2xl">{gym.name}</h1>
                  <button 
                    onClick={toggleFavorite}
                    className={`mobile-btn-secondary transition-all duration-200 ${
                      isFavorite 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'hover:bg-gray-600/50 hover:text-red-400'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart 
                      className={`minimal-icon transition-all duration-200 ${
                        isFavorite ? 'fill-current' : ''
                      }`} 
                    />
                  </button>
                </div>
                <div className="minimal-flex mobile-text-xs text-gray-400 mb-1">
                  <MapPin className="minimal-icon mr-1" />
                  <span>{gym.city}, {gym.country}</span>
                </div>
                <div className="minimal-flex mobile-text-xs text-gray-400">
                  <span>{gym.wall_height}</span>
                </div>
              </div>
            </div>
          </div>


          {/* Tab Content */}
          <div className="mobile-card animate-slide-up">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}