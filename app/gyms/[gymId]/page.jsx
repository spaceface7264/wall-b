import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { MapPin, Clock, Phone, Mail, Globe, Star, Heart, Dumbbell, Users, Calendar, Info, MessageCircle, Plus, MoreVertical, Edit2, Trash2, X, Shield, Upload, List, Crosshair } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import TabNavigation from '../../components/TabNavigation';
import CalendarView from '../../components/CalendarView';
import CommunityCard from '../../components/CommunityCard';
import { EmptyCommunities } from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import FocalPointSelector from '../../components/FocalPointSelector';
import { useToast } from '../../providers/ToastProvider';
import { useLoginModal } from '../../providers/LoginModalProvider';
import { enrichCommunitiesWithActualCounts } from '../../../lib/community-utils';
import GymDetailSkeleton from '../../components/GymDetailSkeleton';

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
  'Outdoor Terrace'
];

export default function GymDetail() {
  const [gym, setGym] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('communities');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingGym, setEditingGym] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [newDifficulty, setNewDifficulty] = useState('');
  const [useSameHoursForAll, setUseSameHoursForAll] = useState(false);
  const [universalHours, setUniversalHours] = useState('');
  const [originalGymData, setOriginalGymData] = useState(null);
  const [showChangesConfirmation, setShowChangesConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [imageFocalX, setImageFocalX] = useState(0.5);
  const [imageFocalY, setImageFocalY] = useState(0.5);
  const [showFocalPointSelector, setShowFocalPointSelector] = useState(false);
  const [isUpdatingGym, setIsUpdatingGym] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { showLoginModal } = useLoginModal();

  const tabs = [
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'details', label: 'Details', icon: Info }
  ];

  useEffect(() => {
    getUser();
    
    // Check for tab query parameter
    const tabParam = searchParams.get('tab');
    if (tabParam && ['details', 'communities', 'events'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [params.gymId, searchParams]);

  // Fetch gym when user check is complete (to ensure admin status is available)
  useEffect(() => {
    if (params.gymId && userLoaded) {
      fetchGym(params.gymId);
    }
  }, [params.gymId, userLoaded]);

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
        await checkAdminStatus(user.id);
        if (params.gymId) {
          await checkFavoriteStatus(user.id, params.gymId);
        }
      }
      setUserLoaded(true);
    } catch (error) {
      console.log('Error getting user:', error);
      setUserLoaded(true);
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

  const fetchGym = async (gymId, skipLoading = false) => {
    try {
      if (!skipLoading) {
      setLoading(true);
      }
      console.log('Fetching gym with ID:', gymId);
      
      // Check admin status before fetching (needed for access control)
      // Always check if user exists to get the most current admin status
      let currentAdminStatus = isAdmin;
      if (user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching admin status:', profileError);
            currentAdminStatus = false;
          } else {
            currentAdminStatus = profile?.is_admin || false;
            // Update state if it changed
            if (currentAdminStatus !== isAdmin) {
              setIsAdmin(currentAdminStatus);
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          // If check fails, assume not admin for safety
          currentAdminStatus = false;
        }
      } else {
        // No user = definitely not admin
        currentAdminStatus = false;
      }
      
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
        // Check if gym is hidden and block non-admins
        // Also check isAdmin state in case it was updated
        const hasAdminAccess = currentAdminStatus || isAdmin;
        const isGymHidden = data.is_hidden === true; // Explicitly check for true
        
        if (isGymHidden && !hasAdminAccess) {
          showToast('error', 'Access Denied', 'This gym is hidden from public view.');
          navigate('/gyms');
          return;
        }
        setGym(data);
        await loadCommunities(data.id);
        await loadEvents(data.id);
      }
    } catch (error) {
      console.error('Error fetching gym:', error);
      setGym(null);
    } finally {
      if (!skipLoading) {
      setLoading(false);
      }
    }
  };

  const loadCommunities = async (gymId) => {
    try {
      let query = supabase
        .from('communities')
        .select('*')
        .eq('gym_id', gymId)
        .eq('community_type', 'gym');
      
      // Only filter suspended communities if user is not admin
      if (!isAdmin) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;

      if (error) {
        console.log('Error loading communities, showing empty state');
        setCommunities([]);
        return;
      }

      // Filter out suspended communities for non-admins (double-check)
      const activeCommunities = isAdmin 
        ? (data || [])
        : (data || []).filter(c => c.is_active !== false);

      // Enrich communities with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(activeCommunities);
      setCommunities(enrichedCommunities);
    } catch (error) {
      console.log('Error loading communities, showing empty state');
      setCommunities([]);
    }
  };

  const loadEvents = async (gymId) => {
    try {
      // First, get communities for this gym
      let communitiesQuery = supabase
        .from('communities')
        .select('id')
        .eq('gym_id', gymId);
      
      // Only filter suspended communities if user is not admin
      if (!isAdmin) {
        communitiesQuery = communitiesQuery.eq('is_active', true);
      }
      
      const { data: communities, error: communitiesError } = await communitiesQuery;

      if (communitiesError) {
        console.error('Error loading communities for events:', communitiesError);
        setEvents([]);
        return;
      }

      // Filter out suspended communities for non-admins (double-check)
      const activeCommunities = isAdmin 
        ? (communities || [])
        : (communities || []).filter(c => c.is_active !== false);

      if (!activeCommunities || activeCommunities.length === 0) {
        setEvents([]);
        return;
      }

      // Then get events for those active communities
      const communityIds = activeCommunities.map(c => c.id);
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
        <div key={day} className={`minimal-flex-between py-2 px-2 rounded ${isToday ? 'bg-[#00d4ff]/30' : ''}`}>
          <span className={`minimal-text text-sm ${isToday ? 'text-[#00d4ff] font-medium' : ''}`}>
            {dayNames[index]}:
          </span>
          <span className={`minimal-text text-sm ${isClosed ? 'text-gray-500' : isToday ? 'text-[#00d4ff] font-medium' : 'text-gray-300'}`}>
            {hours[day] || 'Closed'}
          </span>
        </div>
      );
    });
  };

  const calculateChanges = (originalData, newData) => {
    const changes = [];
    
    // Helper to format facilities
    const formatFacilities = (facilities) => {
      if (!facilities || facilities.length === 0) return 'None';
      return Array.isArray(facilities) ? facilities.join(', ') : facilities;
    };
    
    // Helper to format opening hours
    const formatOpeningHours = (hours) => {
      if (!hours || Object.keys(hours).length === 0) return 'Not set';
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return days.map(day => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        return `${dayName}: ${hours[day] || 'Closed'}`;
      }).join('; ');
    };
    
    // Compare each field
    const fields = [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'website', label: 'Website' },
      { key: 'image_url', label: 'Image URL' },
      { key: 'logo_url', label: 'Logo URL' },
    ];
    
    fields.forEach(field => {
      const oldVal = (originalData[field.key] || '').trim();
      const newVal = (newData[field.key] || '').trim();
      
      if (oldVal !== newVal) {
        changes.push({
          field: field.label,
          oldValue: oldVal || '(empty)',
          newValue: newVal || '(empty)'
        });
      }
    });
    
    // Compare facilities
    const oldFacilities = Array.isArray(originalData.facilities) ? originalData.facilities : [];
    const newFacilities = Array.isArray(newData.facilities) ? newData.facilities : [];
    const oldFacilitiesStr = oldFacilities.sort().join(',');
    const newFacilitiesStr = newFacilities.sort().join(',');
    
    if (oldFacilitiesStr !== newFacilitiesStr) {
      changes.push({
        field: 'Facilities',
        oldValue: formatFacilities(oldFacilities),
        newValue: formatFacilities(newFacilities)
      });
    }
    
    // Compare opening hours
    const oldHours = originalData.opening_hours || {};
    const newHours = newData.opening_hours || {};
    const oldHoursStr = JSON.stringify(oldHours);
    const newHoursStr = JSON.stringify(newHours);
    
    if (oldHoursStr !== newHoursStr) {
      changes.push({
        field: 'Opening Hours',
        oldValue: formatOpeningHours(oldHours),
        newValue: formatOpeningHours(newHours)
      });
    }
    
    // Compare focal point
    const oldFocalX = originalData.image_focal_x ?? 0.5;
    const oldFocalY = originalData.image_focal_y ?? 0.5;
    const newFocalX = newData.image_focal_x ?? 0.5;
    const newFocalY = newData.image_focal_y ?? 0.5;
    
    if (Math.abs(oldFocalX - newFocalX) > 0.01 || Math.abs(oldFocalY - newFocalY) > 0.01) {
      changes.push({
        field: 'Image Focal Point',
        oldValue: `X: ${(oldFocalX * 100).toFixed(0)}%, Y: ${(oldFocalY * 100).toFixed(0)}%`,
        newValue: `X: ${(newFocalX * 100).toFixed(0)}%, Y: ${(newFocalY * 100).toFixed(0)}%`
      });
    }
    
    return changes;
  };

  const handleUpdateGym = async (gymData) => {
    if (!gym || !isAdmin) {
      console.error('Cannot update: missing gym or not admin', { gym: !!gym, isAdmin });
      showToast('error', 'Error', 'Missing gym data or not authorized');
      setShowEditModal(false);
      setEditingGym(null);
      return false;
    }

    // Only update if gym.id is a valid UUID (not mock data)
    if (!isValidUUID(gym.id)) {
      showToast('error', 'Error', 'Cannot edit mock gym data');
      setShowEditModal(false);
      setEditingGym(null);
      return false;
    }

    try {
      // Clean up opening_hours - remove empty string values, keep only non-empty ones
      const cleanedOpeningHours = {};
      if (gymData.opening_hours && typeof gymData.opening_hours === 'object') {
        Object.keys(gymData.opening_hours).forEach(day => {
          const hours = gymData.opening_hours[day];
          if (hours && hours.trim() !== '') {
            cleanedOpeningHours[day] = hours.trim();
          }
        });
      }

      // Validate required fields first
      const name = (gymData.name || '').trim();
      const address = (gymData.address || '').trim();
      const city = (gymData.city || '').trim();
      const country = (gymData.country || '').trim();

      if (!name || !address || !city || !country) {
        showToast('error', 'Error', 'Name, address, city, and country are required fields');
        return false;
      }

      // Clean up empty strings to null for optional fields only
      // Prepare facilities - ensure it's always an array
      const facilities = Array.isArray(gymData.facilities) 
        ? (gymData.facilities.length > 0 ? gymData.facilities : [])
        : [];

      // Prepare difficulty_levels - ensure it's always an array
      const difficulty_levels = Array.isArray(gymData.difficulty_levels) 
        ? (gymData.difficulty_levels.length > 0 ? gymData.difficulty_levels : [])
        : [];

      const cleanedData = {
        name: name,
        description: (gymData.description || '').trim() || null,
        address: address,
        city: city,
        country: country,
        phone: (gymData.phone || '').trim() || null,
        email: (gymData.email || '').trim() || null,
        website: (gymData.website || '').trim() || null,
                      image_url: uploadedImageUrl || (gymData.image_url || '').trim() || null,
                      image_focal_x: imageFocalX,
                      image_focal_y: imageFocalY,
                      logo_url: uploadedLogoUrl || (gymData.logo_url || '').trim() || null,
        facilities: facilities,
        opening_hours: Object.keys(cleanedOpeningHours).length > 0 ? cleanedOpeningHours : {},
        // Admin-only fields
        single_entry_price: (gymData.single_entry_price || '').trim() || null,
        membership_price: (gymData.membership_price || '').trim() || null,
        price_range: (gymData.price_range || '').trim() || null,
        latitude: gymData.latitude ? parseFloat(gymData.latitude) : null,
        longitude: gymData.longitude ? parseFloat(gymData.longitude) : null,
        difficulty_levels: difficulty_levels,
        is_hidden: gymData.is_hidden || false,
        updated_at: new Date().toISOString()
      };

      console.log('Updating gym with data:', cleanedData);
      console.log('Gym ID:', gym.id);

      console.log('About to call Supabase update...');
      console.log('Cleaned data being sent:', JSON.stringify(cleanedData, null, 2));
      
      // Try a simpler update first - without .select() to see if that's causing the hang
      try {
        console.log('Attempting Supabase update...');
        
        // First, try a simple update without select
        const { error: updateError } = await supabase
          .from('gyms')
          .update(cleanedData)
          .eq('id', gym.id);

        if (updateError) {
          console.error('❌ Error updating gym:', updateError);
          showToast('error', 'Error', `Failed to update gym: ${updateError.message}`);
          return false;
        }

        console.log('✅ Gym update successful');
        
        // Now fetch the updated data separately
        const { data: updatedGym, error: fetchError } = await supabase
          .from('gyms')
          .select('*')
          .eq('id', gym.id)
          .single();

        if (fetchError) {
          console.warn('⚠️ Update succeeded but failed to fetch updated data:', fetchError);
          // Don't fail the update if fetch fails - update was successful
        }

        const data = updatedGym;
        const error = null;

        if (error) {
          console.error('❌ Error updating gym:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Provide helpful error message for missing columns
          let errorMessage = error.message;
          if (error.message && error.message.includes('facilities')) {
            errorMessage = 'Missing facilities column. Please run the migration script: sql-scripts/add-missing-gym-columns.sql';
          } else if (error.message && error.message.includes('schema cache')) {
            errorMessage = 'Schema cache error. Please refresh the Supabase schema cache or run the migration script.';
          }
          
          showToast('error', 'Error', `Failed to update gym: ${errorMessage}`);
          return false;
        }

        console.log('Update response:', { data, error });
        console.log('Gym updated successfully:', data);
      } catch (updateError) {
        console.error('❌ Unexpected error during update:', updateError);
        showToast('error', 'Error', `Update failed: ${updateError.message || 'Unknown error'}`);
        return false;
      }

      // Always close modal and reset states
        setShowEditModal(false);
        setEditingGym(null);
      setUploadedImageUrl(null);
      setImagePreview(null);
      setUploadedLogoUrl(null);
      setLogoPreview(null);
      setSelectedFacilities([]);
      setSelectedDifficulties([]);
      setNewDifficulty('');
      setOriginalGymData(null);
      setShowChangesConfirmation(false);
      setPendingChanges(null);
      setImageFocalX(0.5);
      setImageFocalY(0.5);
      setShowFocalPointSelector(false);
      setUseSameHoursForAll(false);
      setUniversalHours('');

      // Always reload gym data to ensure we have the latest state from database
      // This handles cases where RLS policies might filter returned data
      console.log('Reloading gym data to ensure latest state...');
      await fetchGym(gym.id, true); // Skip loading spinner during refresh
      
        showToast('success', 'Success', 'Gym updated successfully');
        return true;
    } catch (error) {
      console.error('Error updating gym:', error);
      console.error('Error stack:', error.stack);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
        // Still close modal even on error to allow retry
        setShowEditModal(false);
        setEditingGym(null);
        setUploadedImageUrl(null);
        setImagePreview(null);
        setUploadedLogoUrl(null);
        setLogoPreview(null);
        setSelectedFacilities([]);
        setSelectedDifficulties([]);
        setNewDifficulty('');
        setOriginalGymData(null);
        setShowChangesConfirmation(false);
        setPendingChanges(null);
        setImageFocalX(0.5);
        setImageFocalY(0.5);
        setShowFocalPointSelector(false);
        return false;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Image size must be less than 5MB.');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `gyms/${gym?.id || 'temp'}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showToast('error', 'Upload Failed', `Failed to upload: ${uploadError.message}`);
        setIsUploadingImage(false);
        setImagePreview(null);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      setUploadedImageUrl(publicUrl);
      // Reset focal point to center when new image is uploaded
      setImageFocalX(0.5);
      setImageFocalY(0.5);
      showToast('success', 'Uploaded!', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Upload Failed', 'Failed to upload image.');
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImageUrl(null);
    setImagePreview(null);
    // Reset focal point to center
    setImageFocalX(0.5);
    setImageFocalY(0.5);
    // Reset the file input
    const fileInput = document.getElementById('gym-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Logo size must be less than 5MB.');
      return;
    }

    setIsUploadingLogo(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `gyms/${gym?.id || 'temp'}/logo_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showToast('error', 'Upload Failed', `Failed to upload: ${uploadError.message}`);
        setIsUploadingLogo(false);
        setLogoPreview(null);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      setUploadedLogoUrl(publicUrl);
      showToast('success', 'Uploaded!', 'Logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('error', 'Upload Failed', 'Failed to upload logo.');
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveUploadedLogo = () => {
    setUploadedLogoUrl(null);
    setLogoPreview(null);
    // Reset the file input
    const fileInput = document.getElementById('gym-logo-upload');
    if (fileInput) {
      fileInput.value = '';
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
                  <MapPin className="minimal-icon mr-2 text-[#00d4ff]" />
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
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#00d4ff] hover:text-[#00b8e6] transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>

              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Phone className="minimal-icon mr-2 text-[#00d4ff]" />
                  Contact
                </h4>
                <div className="space-y-3">
                  {gym.phone && (
                    <div className="minimal-flex">
                      <Phone className="minimal-icon mr-3 text-gray-400" />
                      <a href={`tel:${gym.phone}`} className="minimal-text text-sm text-[#00d4ff] hover:text-[#00d4ff] transition-colors">
                        {gym.phone}
                      </a>
                    </div>
                  )}
                  {gym.email && (
                    <div className="minimal-flex">
                      <Mail className="minimal-icon mr-3 text-gray-400" />
                      <a href={`mailto:${gym.email}`} className="minimal-text text-sm text-[#00d4ff] hover:text-[#00d4ff] transition-colors">
                        {gym.email}
                      </a>
                    </div>
                  )}
                  {gym.website && (
                    <div className="minimal-flex">
                      <Globe className="minimal-icon mr-3 text-gray-400" />
                      <a href={gym.website} target="_blank" rel="noopener noreferrer" className="minimal-text text-sm text-[#00d4ff] hover:text-[#00d4ff] transition-colors">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Google Rating */}
            {(gym.google_rating || gym.google_ratings_count) && (
              <div className="border-b border-gray-700/50 pb-6 mb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Star className="minimal-icon mr-2 text-[#00d4ff]" />
                  Google Rating
                </h4>
                <div className="flex items-center gap-4">
                  {gym.google_rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="minimal-heading ml-2">{gym.google_rating.toFixed(1)}</span>
                      </div>
                      {gym.google_ratings_count && (
                        <span className="minimal-text text-sm text-gray-400">
                          ({gym.google_ratings_count} {gym.google_ratings_count === 1 ? 'review' : 'reviews'})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {gym.description && (
              <div className="border-b border-gray-700/50 pb-6 mb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Info className="minimal-icon mr-2 text-[#00d4ff]" />
                  About
                </h4>
                <p className="minimal-text text-sm text-gray-300 leading-relaxed">{gym.description}</p>
              </div>
            )}

            {/* Facilities & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-b border-gray-700/50 pb-6">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <Dumbbell className="minimal-icon mr-2 text-[#00d4ff]" />
                Facilities
              </h4>
                <div className="grid grid-cols-2 gap-3">
                {(Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]')).map((facility, index) => {
                  const IconComponent = getFacilityIcon(facility);
                  return (
                      <div key={index} className="minimal-flex mobile-text-sm bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      <IconComponent className="w-4 h-4 mr-2 text-[#00d4ff]" />
                      {facility}
                    </div>
                  );
                })}
              </div>
            </div>

              <div className="border-b border-gray-700/50 pb-6">
                <h4 className="minimal-heading mb-4 minimal-flex">
                  <Clock className="minimal-icon mr-2 text-[#00d4ff]" />
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
                <Users className="minimal-icon mr-2 text-[#00d4ff]" />
                Communities at this gym
              </h2>
                {user && (
                  <button 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d4ff] text-white rounded-full text-sm font-medium hover:bg-[#00b8e6] transition-colors"
                    onClick={() => navigate(`/community/new?gym_id=${gym.id}`)}
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                )}
            </div>
            
            {communities.length === 0 ? (
              <EmptyCommunities onCreateClick={user ? () => navigate(`/community/new?gym_id=${gym.id}`) : () => {
                showLoginModal({ subtitle: 'Sign in to create communities' });
              }} />
            ) : (
              <div style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                <div className="flex flex-col gap-3 px-3">
                  {communities.map((community) => (
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
                        isMember={false}
                        onOpen={() => navigate(`/community/${community.id}`)}
                        onJoin={() => {}}
                        onLeave={() => {}}
                        onReport={() => {}}
                      />
                    </div>
                  ))}
                </div>
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
            {/* Gym Image with Logo Watermark */}
            <div className="w-full h-48 bg-gray-700 overflow-hidden mb-4 relative">
              <img 
                src={gym.image_url} 
                alt={gym.name}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: gym.image_focal_x !== undefined && gym.image_focal_y !== undefined
                    ? `${gym.image_focal_x * 100}% ${gym.image_focal_y * 100}%`
                    : 'center'
                }}
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
              
              {/* Logo Watermark - Top Right */}
              {gym.logo_url && (
                <div 
                  className="absolute top-3 right-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    padding: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img 
                    src={gym.logo_url} 
                    alt={`${gym.name} logo`}
                    className="w-full h-full object-contain"
                    style={{
                      opacity: 0.9,
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
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
                            setUploadedImageUrl(null);
                            setImagePreview(null);
                            setUploadedLogoUrl(null);
                            setLogoPreview(null);
                            // Initialize selected facilities from gym data
                            const gymFacilities = Array.isArray(gym.facilities) 
                              ? gym.facilities 
                              : (typeof gym.facilities === 'string' ? JSON.parse(gym.facilities || '[]') : []);
                            setSelectedFacilities(gymFacilities);
                            // Initialize selected difficulties from gym data
                            const gymDifficulties = Array.isArray(gym.difficulty_levels) 
                              ? gym.difficulty_levels 
                              : [];
                            setSelectedDifficulties(gymDifficulties);
                            // Store original data for comparison
                            setOriginalGymData({
                              ...gym,
                              facilities: gymFacilities,
                              difficulty_levels: gymDifficulties
                            });
                            // Initialize focal point from gym data or default to center
                            setImageFocalX(gym.image_focal_x ?? 0.5);
                            setImageFocalY(gym.image_focal_y ?? 0.5);
                            // Check if all days have the same hours
                            const hours = gym.opening_hours || {};
                            const hoursArray = Object.values(hours).filter(Boolean);
                            const allSame = hoursArray.length > 0 && hoursArray.every(h => h === hoursArray[0]);
                            setUseSameHoursForAll(allSame);
                            setUniversalHours(allSame ? hoursArray[0] || '' : '');
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

          {/* Hidden Gym Warning (Admin Only) */}
          {gym.is_hidden && isAdmin && (
            <div className="animate-slide-up mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-300">
                This gym is hidden from public view. Only admins can see this page.
              </span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="animate-slide-up mb-6">
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
                      setUploadedImageUrl(null);
                      setImagePreview(null);
                      setSelectedFacilities([]);
                      setSelectedDifficulties([]);
                      setNewDifficulty('');
                      setOriginalGymData(null);
                      setImageFocalX(0.5);
                      setImageFocalY(0.5);
                      setShowFocalPointSelector(false);
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
                  try {
                    const formData = new FormData(e.target);
                    let openingHours;
                    
                    if (useSameHoursForAll) {
                      // Apply universal hours to all days
                      const universalValue = universalHours || '';
                      openingHours = {
                        monday: universalValue,
                        tuesday: universalValue,
                        wednesday: universalValue,
                        thursday: universalValue,
                        friday: universalValue,
                        saturday: universalValue,
                        sunday: universalValue
                      };
                    } else {
                      // Use individual day values
                      openingHours = {
                        monday: formData.get('monday') || '',
                        tuesday: formData.get('tuesday') || '',
                        wednesday: formData.get('wednesday') || '',
                        thursday: formData.get('thursday') || '',
                        friday: formData.get('friday') || '',
                        saturday: formData.get('saturday') || '',
                        sunday: formData.get('sunday') || ''
                      };
                    }

                    const newData = {
                      name: formData.get('name') || '',
                      description: formData.get('description') || '',
                      address: formData.get('address') || '',
                      city: formData.get('city') || '',
                      country: formData.get('country') || '',
                      phone: formData.get('phone') || '',
                      email: formData.get('email') || '',
                      website: formData.get('website') || '',
                      image_url: uploadedImageUrl || formData.get('image_url') || '',
                      image_focal_x: imageFocalX,
                      image_focal_y: imageFocalY,
                      logo_url: uploadedLogoUrl || formData.get('logo_url') || '',
                      facilities: selectedFacilities,
                      opening_hours: openingHours,
                      // Admin-only fields
                      single_entry_price: formData.get('single_entry_price') || '',
                      membership_price: formData.get('membership_price') || '',
                      price_range: formData.get('price_range') || '',
                      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
                      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null,
                      difficulty_levels: selectedDifficulties,
                      is_hidden: formData.get('is_hidden') === 'on' || formData.get('is_hidden') === 'true'
                    };

                    // Calculate changes and show confirmation
                    const changes = calculateChanges(originalGymData, newData);
                    
                    if (changes.length === 0) {
                      showToast('info', 'No Changes', 'No changes were made.');
                      return;
                    }

                    // Store pending changes and show confirmation
                    setPendingChanges({ data: newData, changes });
                    // Show confirmation (keep edit modal open in background)
                    setShowChangesConfirmation(true);
                  } catch (error) {
                    console.error('Error in form submission:', error);
                    showToast('error', 'Error', 'Failed to process changes. Please try again.');
                    setShowChangesConfirmation(false);
                    setPendingChanges(null);
                  }
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingGym.description}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
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
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={editingGym.city}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      defaultValue={editingGym.country}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={editingGym.phone || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingGym.email || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      defaultValue={editingGym.website || ''}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gym Image</label>
                    
                    {/* Image Preview */}
                    {(imagePreview || uploadedImageUrl || editingGym?.image_url) && (
                      <div className="mb-3 relative">
                        <img
                          src={imagePreview || uploadedImageUrl || editingGym?.image_url}
                          alt="Gym preview"
                          className="w-full h-48 object-cover rounded border border-gray-700"
                          style={{ 
                            borderRadius: 4,
                            objectPosition: `${imageFocalX * 100}% ${imageFocalY * 100}%`
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowFocalPointSelector(true)}
                            className="p-2 bg-[#00d4ff] hover:bg-[#00b8e6] text-white rounded-full transition-colors"
                            title="Set focal point"
                          >
                            <Crosshair className="w-4 h-4" />
                          </button>
                          {(imagePreview || uploadedImageUrl) && (
                            <button
                              type="button"
                              onClick={handleRemoveUploadedImage}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* File Upload Option */}
                    <div className="mb-3">
                      <label
                        htmlFor="gym-image-upload"
                        className={`
                          flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded cursor-pointer transition-colors
                          ${isUploadingImage 
                            ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
                            : 'border-gray-500 bg-gray-800/50 hover:border-gray-400 hover:bg-gray-800'
                          }
                        `}
                        style={{ borderRadius: 4 }}
                      >
                        <Upload className={`w-4 h-4 text-gray-400 ${isUploadingImage ? 'animate-pulse' : ''}`} />
                        <span className="text-sm text-gray-300">
                          {isUploadingImage ? 'Uploading...' : 'Upload Image File'}
                        </span>
                      </label>
                      <input
                        id="gym-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, or WebP. Max 5MB.
                      </p>
                    </div>

                    {/* URL Input Option */}
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-xs text-gray-500 px-2">OR</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>
                    <input
                      type="url"
                      name="image_url"
                      defaultValue={editingGym.image_url || ''}
                        placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                        disabled={!!uploadedImageUrl}
                    />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter an image URL instead
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gym Logo</label>
                    
                    {/* Logo Preview */}
                    {(logoPreview || uploadedLogoUrl || editingGym?.logo_url) && (
                      <div className="mb-3 relative">
                        <div 
                          className="bg-gray-800/50 border border-gray-700 rounded overflow-hidden"
                          style={{ 
                            width: '200px',
                            height: '200px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={logoPreview || uploadedLogoUrl || editingGym?.logo_url}
                            alt="Gym logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {(logoPreview || uploadedLogoUrl) && (
                          <button
                            type="button"
                            onClick={handleRemoveUploadedLogo}
                            className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            title="Remove logo"
                          >
                            <X className="w-3 h-3 inline mr-1" />
                            Remove Logo
                          </button>
                        )}
                      </div>
                    )}

                    {/* File Upload Option */}
                    <div className="mb-3">
                      <label
                        htmlFor="gym-logo-upload"
                        className={`
                          flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded cursor-pointer transition-colors
                          ${isUploadingLogo 
                            ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
                            : 'border-gray-500 bg-gray-800/50 hover:border-gray-400 hover:bg-gray-800'
                          }
                        `}
                        style={{ borderRadius: 4 }}
                      >
                        <Upload className={`w-4 h-4 text-gray-400 ${isUploadingLogo ? 'animate-pulse' : ''}`} />
                        <span className="text-sm text-gray-300">
                          {isUploadingLogo ? 'Uploading...' : 'Upload Logo File'}
                        </span>
                      </label>
                      <input
                        id="gym-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        PNG or SVG recommended. Max 5MB. Logo will be displayed with transparent background.
                      </p>
                    </div>

                    {/* URL Input Option */}
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-xs text-gray-500 px-2">OR</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>
                      <input
                        type="url"
                        name="logo_url"
                        defaultValue={editingGym.logo_url || ''}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                        disabled={!!uploadedLogoUrl}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a logo URL instead
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Facilities
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Select all facilities available at this gym
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableFacilities.map((facility) => (
                      <label
                        key={facility}
                        className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors"
                        style={{ borderRadius: 4 }}
                      >
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
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-200 select-none">
                          {facility}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedFacilities.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedFacilities.length} facility{selectedFacilities.length !== 1 ? 'ies' : ''} selected
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Opening Hours</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSameHoursForAll}
                        onChange={(e) => {
                          setUseSameHoursForAll(e.target.checked);
                          if (e.target.checked && !universalHours) {
                            // If enabling and no universal hours set, use first non-empty day's hours
                            const hours = editingGym?.opening_hours || {};
                            const firstDay = Object.values(hours).find(h => h && h.trim() !== '');
                            setUniversalHours(firstDay || '');
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-400">Same hours for all days</span>
                    </label>
                  </div>
                  
                  {useSameHoursForAll ? (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Hours for all days</label>
                      <input
                        type="text"
                        value={universalHours}
                        onChange={(e) => setUniversalHours(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                        placeholder="9:00-22:00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will apply to Monday through Sunday
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day}>
                          <label className="block text-xs text-gray-400 mb-1 capitalize">{day}</label>
                          <input
                            type="text"
                            name={day}
                            defaultValue={editingGym.opening_hours?.[day] || ''}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                            placeholder="9:00-22:00"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin-only fields section */}
                {isAdmin && (
                  <>
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-300 mb-4">Admin Settings</h4>
                      
                      {/* Price Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Single Entry Price</label>
                          <input
                            type="text"
                            name="single_entry_price"
                            defaultValue={editingGym.single_entry_price || ''}
                            placeholder="e.g., $20, €15-25"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Membership Price</label>
                          <input
                            type="text"
                            name="membership_price"
                            defaultValue={editingGym.membership_price || ''}
                            placeholder="e.g., $80/month, €50/month"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Price Range</label>
                          <input
                            type="text"
                            name="price_range"
                            defaultValue={editingGym.price_range || ''}
                            placeholder="e.g., $15-30"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                        </div>
                      </div>

                      {/* Difficulty Levels */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Levels</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedDifficulties.map((difficulty, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 flex items-center gap-1 rounded" style={{ borderRadius: 2 }}>
                              {difficulty}
                              <button 
                                type="button" 
                                onClick={() => setSelectedDifficulties(selectedDifficulties.filter((_, i) => i !== idx))} 
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newDifficulty}
                            onChange={(e) => setNewDifficulty(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newDifficulty.trim() && !selectedDifficulties.includes(newDifficulty.trim())) {
                                  setSelectedDifficulties([...selectedDifficulties, newDifficulty.trim()]);
                                  setNewDifficulty('');
                                }
                              }
                            }}
                            placeholder="Add difficulty level"
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              if (newDifficulty.trim() && !selectedDifficulties.includes(newDifficulty.trim())) {
                                setSelectedDifficulties([...selectedDifficulties, newDifficulty.trim()]);
                                setNewDifficulty('');
                              }
                            }} 
                            className="px-3 py-2 bg-gray-700 text-white text-sm hover:bg-gray-600 rounded transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Location Coordinates */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            name="latitude"
                            defaultValue={editingGym.latitude || ''}
                            placeholder="e.g., 55.6761"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            name="longitude"
                            defaultValue={editingGym.longitude || ''}
                            placeholder="e.g., 12.5683"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                          />
                        </div>
                      </div>

                      {/* Hide from public */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_hidden"
                            defaultChecked={editingGym.is_hidden || false}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-300">Hide from public listing</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingGym(null);
                      setUploadedImageUrl(null);
                      setImagePreview(null);
                      setSelectedFacilities([]);
                      setSelectedDifficulties([]);
                      setNewDifficulty('');
                      setOriginalGymData(null);
                      setImageFocalX(0.5);
                      setImageFocalY(0.5);
                      setShowFocalPointSelector(false);
                      setUseSameHoursForAll(false);
                      setUniversalHours('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#00d4ff] text-white rounded hover:bg-[#00b8e6] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Focal Point Selector Modal */}
      {showFocalPointSelector && (imagePreview || uploadedImageUrl || editingGym?.image_url) && (
        <FocalPointSelector
          imageUrl={imagePreview || uploadedImageUrl || editingGym?.image_url}
          focalX={imageFocalX}
          focalY={imageFocalY}
          onFocalPointChange={(x, y) => {
            setImageFocalX(x);
            setImageFocalY(y);
          }}
          onClose={() => setShowFocalPointSelector(false)}
          aspectRatio="square"
        />
      )}

      {/* Changes Confirmation Modal */}
      {showChangesConfirmation && pendingChanges && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ borderRadius: 4 }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Changes</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Review the changes you're about to make to "{gym?.name}"
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChangesConfirmation(false);
                  setPendingChanges(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3" style={{ borderRadius: 4 }}>
                  <p className="text-sm text-blue-300 font-medium mb-1">
                    {pendingChanges.changes.length} change{pendingChanges.changes.length !== 1 ? 's' : ''} detected
                  </p>
                  <p className="text-xs text-blue-200/80">
                    Please review all changes below before confirming.
                  </p>
                </div>

                <div className="space-y-3">
                  {pendingChanges.changes.map((change, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-700 rounded p-3 bg-gray-800/50"
                      style={{ borderRadius: 4 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-white">{change.field}:</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                              Changed
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Previous:</p>
                              <p className="text-sm text-gray-300 bg-red-500/10 border border-red-500/20 rounded p-2 break-words">
                                {change.oldValue}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">New:</p>
                              <p className="text-sm text-white bg-green-500/10 border border-green-500/20 rounded p-2 break-words">
                                {change.newValue}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowChangesConfirmation(false);
                  setPendingChanges(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Prevent multiple clicks
                  if (isUpdatingGym) {
                    console.log('Button already processing, ignoring click');
                    return;
                  }
                  
                  setIsUpdatingGym(true);
                  
                  try {
                    console.log('Confirm button clicked, calling handleUpdateGym with:', pendingChanges.data);
                    const success = await handleUpdateGym(pendingChanges.data);
                    if (success) {
                      // Explicitly close confirmation modal
                      setShowChangesConfirmation(false);
                      setPendingChanges(null);
                      setIsUpdatingGym(false);
                      console.log('Gym update successful');
                    } else {
                      console.error('Gym update failed');
                      setIsUpdatingGym(false);
                      // Keep modal open on failure so user can see errors
                    }
                  } catch (error) {
                    console.error('Error in confirm button handler:', error);
                    showToast('error', 'Error', `Failed to update gym: ${error.message || 'Unknown error'}`);
                    setIsUpdatingGym(false);
                  }
                }}
                disabled={isUpdatingGym}
                className="flex-1 px-4 py-2 bg-[#00d4ff] text-white rounded hover:bg-[#00b8e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isUpdatingGym ? 'Processing...' : 'Confirm Changes'}
              </button>
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