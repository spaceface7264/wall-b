import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MapPin, Heart, Plus, MoreHorizontal } from 'lucide-react';
import GymCard from '../components/GymCard';
import { useToast } from '../providers/ToastProvider';

// Note: This component is wrapped with SidebarLayout in App.jsx, so don't wrap here

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [favoriteGymIds, setFavoriteGymIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching gyms:', error);
        // Fallback to mock data if database doesn't exist yet
        const mockGyms = [
          {
            id: 1,
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
            id: 2,
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
            id: 3,
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
        setGyms(mockGyms);
        const uniqueCountries = [...new Set(mockGyms.map(gym => gym.country))];
        setCountries(uniqueCountries);
      } else {
        setGyms(data || []);
        const uniqueCountries = [...new Set((data || []).map(gym => gym.country))];
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !filterCountry || gym.country === filterCountry;
    return matchesSearch && matchesCountry;
  });

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
        {/* Header */}
        <div className="animate-fade-in mb-6">
          <div className="mobile-card-header">
            <div className="animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="mobile-card-subtitle text-center mt-4">
                    Discover bouldering gyms around the world
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="mobile-btn-secondary p-2"
                  >
                    <MoreHorizontal className="minimal-icon" />
                  </button>
                  
                  {showMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 top-12 z-50 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate('/gyms/request');
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Is your gym missing?</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mobile-card animate-slide-up">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search gyms..."
            className="w-full minimal-input"
          />
        </div>

        {/* Gyms List */}
        <div className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mobile-card animate-fade-in">
                    <div style={{ display: 'flex', gap: '20px' }}>
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
                        <div className="mobile-skeleton h-3 w-16 mb-2"></div>
                        <div className="mobile-skeleton h-4 w-4 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-12">
                  <div className="text-center">
                    <MapPin className="minimal-icon mx-auto mb-4 text-gray-500 text-4xl" />
                    <p className="mobile-text-sm text-gray-400 mb-2">No gyms found matching your search</p>
                    <p className="mobile-text-xs text-gray-500">Try adjusting your search terms or filters</p>
                  </div>
                </div>
              </div>
            ) : (
              filteredGyms.map((gym, index) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  onOpen={openGym}
                  isFavorite={favoriteGymIds.has(gym.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
        </div>
      </div>
  );
}
