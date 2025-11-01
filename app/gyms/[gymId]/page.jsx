import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { MapPin, Clock, Phone, Mail, Globe, Star, Heart, Dumbbell, Users, Calendar, Info, MessageCircle, Plus, MoreVertical, Edit2, Trash2, X, Shield } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import TabNavigation from '../../components/TabNavigation';
import CalendarView from '../../components/CalendarView';
import CommunityCard from '../../components/CommunityCard';
import { EmptyCommunities } from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../providers/ToastProvider';
import { enrichCommunitiesWithActualCounts } from '../../../lib/community-utils';
import GymDetailSkeleton from '../../components/GymDetailSkeleton';

export default function GymDetail() {
  const [gym, setGym] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGym, setEditingGym] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const { showToast } = useToast();

  const tabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar }
  ];

  useEffect(() => {
    getUser();
    if (params.gymId) {
      fetchGym(params.gymId);
    }
  }, [params.gymId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
        if (params.gymId) {
          await checkFavoriteStatus(user.id, params.gymId);
        }
      }
    } catch (error) {
      console.log('Error getting user:', error);
    }
  };

  const checkAdminStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const checkFavoriteStatus = async (userId, gymId) => {
    try {
      // Only check favorites if gymId is a valid UUID
      if (!isValidUUID(gymId)) {
        setIsFavorite(false);
        return;
      }
      
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
      
      // If gymId is numeric (mock data), use mock data directly
      if (!isValidUUID(gymId)) {
        console.log('Gym ID is not a UUID, using mock data');
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
        
        // Map numeric IDs to UUIDs for backward compatibility
        const idMap = {
          "1": "11111111-1111-1111-1111-111111111111",
          "2": "22222222-2222-2222-2222-222222222222",
          "3": "33333333-3333-3333-3333-333333333333"
        };
        
        const mappedId = idMap[gymId] || gymId;
        const foundGym = mockGyms.find(gym => gym.id === mappedId || gym.id === gymId);
        
        if (foundGym) {
          setGym(foundGym);
          await loadCommunities(foundGym.id);
          await loadEvents(foundGym.id);
        } else {
          setGym(null);
        }
        return;
      }
      
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

      // Enrich communities with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(data || []);
      setCommunities(enrichedCommunities);
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
        .select('*')
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
        <div key={day} className={`minimal-flex-between py-2 px-2 rounded ${isToday ? 'bg-[#087E8B]/30' : ''}`}>
          <span className={`minimal-text text-sm ${isToday ? 'text-[#087E8B] font-medium' : ''}`}>
            {dayNames[index]}:
          </span>
          <span className={`minimal-text text-sm ${isClosed ? 'text-gray-500' : isToday ? 'text-[#087E8B] font-medium' : 'text-gray-300'}`}>
            {hours[day] || 'Closed'}
          </span>
        </div>
      );
    });
  };

  const handleUpdateGym = async (gymData) => {
    if (!gym || !isAdmin) {
      console.error('Cannot update: missing gym or not admin', { gym: !!gym, isAdmin });
      return;
    }

    // Only update if gym.id is a valid UUID (not mock data)
    if (!isValidUUID(gym.id)) {
      showToast('error', 'Error', 'Cannot edit mock gym data');
      return;
    }

    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = {
        name: gymData.name || null,
        description: gymData.description || null,
        address: gymData.address || null,
        city: gymData.city || null,
        country: gymData.country || null,
        phone: gymData.phone || null,
        email: gymData.email || null,
        website: gymData.website || null,
        image_url: gymData.image_url || null,
        facilities: gymData.facilities && gymData.facilities.length > 0 ? gymData.facilities : [],
        opening_hours: gymData.opening_hours || {},
        updated_at: new Date().toISOString()
      };

      console.log('Updating gym with data:', cleanedData);

      const { data, error } = await supabase
        .from('gyms')
        .update(cleanedData)
        .eq('id', gym.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating gym:', error);
        showToast('error', 'Error', `Failed to update gym: ${error.message}`);
        return;
      }

      console.log('Gym updated successfully:', data);

      // Update local state with the returned data
      if (data) {
        setGym(data);
      } else {
        // Fallback: reload gym data
        await fetchGym(gym.id);
      }

      setShowEditModal(false);
      setEditingGym(null);
      showToast('success', 'Success', 'Gym updated successfully');
    } catch (error) {
      console.error('Error updating gym:', error);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
    }
  };

  const handleDeleteGym = async () => {
    if (!gym || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gym.id);

      if (error) {
        console.error('Error deleting gym:', error);
        showToast('error', 'Error', 'Failed to delete gym');
        return;
      }

      showToast('success', 'Success', 'Gym deleted successfully');
      navigate('/gyms');
    } catch (error) {
      console.error('Error deleting gym:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="gyms" pageTitle={gym?.name}>
        <div className="mobile-container">
          <div className="mobile-section">
            <GymDetailSkeleton />
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
            <div className="minimal-flex-center py-12">
              <div className="text-center">
                <MapPin className="minimal-icon mx-auto mb-2 text-gray-500" />
                <p className="mobile-text-sm">Gym not found</p>
                <button 
                  onClick={() => navigate(-1)}
                  className="mobile-btn-primary mt-4"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const renderTabContent = () => {
    // Build full address for map
    const fullAddress = `${gym.address}, ${gym.city}, ${gym.country}`;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    
    switch (activeTab) {
      case 'details':
        return (
          <div>
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <MapPin className="minimal-icon mr-2 text-[#087E8B]" />
                  Location
                </h4>
                <div className="space-y-3 mb-4">
                  <div className="minimal-flex">
                    <span className="minimal-text text-sm">{gym.address}</span>
                  </div>
                  <div className="minimal-flex">
                    <span className="minimal-text text-sm">{gym.city}, {gym.country}</span>
                  </div>
                </div>
                {/* Map */}
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-700/50 bg-gray-800/30" style={{ height: '250px', position: 'relative' }}>
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/70 transition-colors group cursor-pointer"
                  >
                    <div className="text-center p-4">
                      <MapPin className="w-12 h-12 text-[#087E8B] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-white text-sm font-medium">View on Google Maps</span>
                      <span className="text-gray-400 text-xs block mt-1">Click to open</span>
                    </div>
                  </a>
                </div>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-[#087E8B] hover:text-[#066a75] transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>

              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Phone className="minimal-icon mr-2 text-[#087E8B]" />
                  Contact
                </h4>
                <div className="space-y-3">
                  {gym.phone && (
                    <div className="minimal-flex">
                      <Phone className="minimal-icon mr-3 text-gray-400" />
                      <a href={`tel:${gym.phone}`} className="minimal-text text-sm text-[#087E8B] hover:text-[#087E8B] transition-colors">
                        {gym.phone}
                      </a>
                    </div>
                  )}
                  {gym.email && (
                    <div className="minimal-flex">
                      <Mail className="minimal-icon mr-3 text-gray-400" />
                      <a href={`mailto:${gym.email}`} className="minimal-text text-sm text-[#087E8B] hover:text-[#087E8B] transition-colors">
                        {gym.email}
                      </a>
                    </div>
                  )}
                  {gym.website && (
                    <div className="minimal-flex">
                      <Globe className="minimal-icon mr-3 text-gray-400" />
                      <a href={gym.website} target="_blank" rel="noopener noreferrer" className="minimal-text text-sm text-[#087E8B] hover:text-[#087E8B] transition-colors">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-gray-700/50 pb-6 mb-6">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Star className="minimal-icon mr-2 text-[#087E8B]" />
                About
              </h4>
              <p className="minimal-text text-sm text-gray-300 leading-relaxed">{gym.description}</p>
            </div>

            {/* Facilities & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Dumbbell className="minimal-icon mr-2 text-[#087E8B]" />
                  Facilities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]')).map((facility, index) => {
                    const IconComponent = getFacilityIcon(facility);
                    return (
                      <div key={index} className="minimal-flex mobile-text-sm bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                        <IconComponent className="w-4 h-4 mr-2 text-[#087E8B]" />
                        {facility}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Clock className="minimal-icon mr-2 text-[#087E8B]" />
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="minimal-heading minimal-flex">
                <Users className="minimal-icon mr-2 text-[#087E8B]" />
                Communities at this gym
              </h2>
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#087E8B] text-white rounded-full text-sm font-medium hover:bg-[#066a75] transition-colors"
                onClick={() => navigate(`/community/new?gym_id=${gym.id}`)}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
            
            {communities.length === 0 ? (
              <EmptyCommunities onCreateClick={() => navigate(`/community/new?gym_id=${gym.id}`)} />
            ) : (
              <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                {communities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={false}
                    onOpen={() => navigate(`/community/${community.id}`)}
                    onJoin={() => {}}
                    onLeave={() => {}}
                    onReport={() => {}}
                  />
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
        <div className="mobile-section">
          {/* Gym Header */}
          <div className="animate-slide-up border-b border-gray-700/50" style={{ marginBottom: '24px', paddingBottom: '24px' }}>
            {/* Gym Image */}
            <div className="w-full h-48 bg-gray-700 overflow-hidden mb-4">
              <img 
                src={gym.image_url} 
                alt={gym.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="w-full h-full minimal-flex-center bg-gray-700" style={{display: 'none'}}>
                <MapPin className="minimal-icon text-gray-400 text-5xl" />
              </div>
            </div>

            {/* Gym Name, Address, and Menu */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="mobile-heading mb-2 truncate">{gym.name}</h1>
                <div className="minimal-flex mobile-text-xs text-gray-400 items-center">
                  <MapPin className="minimal-icon mr-1 flex-shrink-0" style={{ width: '14px', height: '14px' }} />
                  <span className="truncate">{gym.address}</span>
                </div>
              </div>
              
              {/* 3-Dot Menu */}
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 rounded-lg shadow-lg"
                    style={{ 
                      minWidth: '180px',
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      zIndex: 9999
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                      style={{ 
                        fontSize: '13px',
                        color: isFavorite ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-red-400' : ''}`} 
                        style={{ flexShrink: 0, color: isFavorite ? '#f87171' : 'var(--text-muted)' }}
                      />
                      <span>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </button>
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-700/50 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGym(gym);
                            setShowEditModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                          style={{ 
                            fontSize: '13px',
                            color: 'var(--text-secondary)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          role="menuitem"
                        >
                          <Edit2 className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                          <span>Edit Gym</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors whitespace-nowrap"
                          style={{ 
                            fontSize: '13px',
                            color: '#ef4444'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          role="menuitem"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
                          <span>Delete Gym</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="animate-slide-up">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          <div className="animate-slide-up">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Edit Gym Modal */}
      {showEditModal && editingGym && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Edit Gym</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGym(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const facilitiesValue = formData.get('facilities') || '';
                  const facilities = facilitiesValue ? facilitiesValue.split(',').map(f => f.trim()).filter(f => f) : [];
                  const openingHours = {
                    monday: formData.get('monday') || '',
                    tuesday: formData.get('tuesday') || '',
                    wednesday: formData.get('wednesday') || '',
                    thursday: formData.get('thursday') || '',
                    friday: formData.get('friday') || '',
                    saturday: formData.get('saturday') || '',
                    sunday: formData.get('sunday') || ''
                  };

                  await handleUpdateGym({
                    name: formData.get('name') || '',
                    description: formData.get('description') || '',
                    address: formData.get('address') || '',
                    city: formData.get('city') || '',
                    country: formData.get('country') || '',
                    phone: formData.get('phone') || '',
                    email: formData.get('email') || '',
                    website: formData.get('website') || '',
                    image_url: formData.get('image_url') || '',
                    facilities: facilities,
                    opening_hours: openingHours
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gym Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingGym.name}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingGym.description}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={editingGym.address}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={editingGym.city}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      defaultValue={editingGym.country}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={editingGym.phone || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingGym.email || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      defaultValue={editingGym.website || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                    <input
                      type="url"
                      name="image_url"
                      defaultValue={editingGym.image_url || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facilities (comma-separated)</label>
                  <input
                    type="text"
                    name="facilities"
                    defaultValue={Array.isArray(editingGym.facilities) ? editingGym.facilities.join(', ') : (typeof editingGym.facilities === 'string' ? editingGym.facilities : '')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                    placeholder="Cafe, Shop, Training Area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Opening Hours</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day}>
                        <label className="block text-xs text-gray-400 mb-1 capitalize">{day}</label>
                        <input
                          type="text"
                          name={day}
                          defaultValue={editingGym.opening_hours?.[day] || ''}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#087E8B]"
                          placeholder="9:00-22:00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingGym(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#087E8B] text-white rounded hover:bg-[#066a75] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGym}
        title="Delete Gym"
        message={`Are you sure you want to delete "${gym?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />
    </SidebarLayout>
  );
}