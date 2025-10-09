'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Clock, Phone, Mail, Globe, Star, ChevronRight, X, Wifi, Car, Coffee, Dumbbell, Users, Shield } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetchGyms();
  }, []);

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
    setSelectedGym(gym);
  };

  const closeGym = () => {
    setSelectedGym(null);
  };

  const getFacilityIcon = (facility) => {
    const iconMap = {
      'Cafe': Coffee,
      'Shop': Globe,
      'Training Area': Dumbbell,
      'Yoga Studio': Users,
      'Kids Area': Users,
      'Locker Rooms': Shield,
      'Parking': Car,
      'Equipment Rental': Globe,
      'Sauna': Shield,
      'Massage': Shield,
      'Bike Storage': Car
    };
    return iconMap[facility] || Globe;
  };

  const formatOpeningHours = (hours) => {
    if (!hours) return 'Hours not available';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => (
      <div key={day} className="minimal-flex-between py-1">
        <span className="minimal-text text-sm">{dayNames[index]}:</span>
        <span className="minimal-text text-sm text-gray-300">{hours[day] || 'Closed'}</span>
      </div>
    ));
  };

  return (
    <SidebarLayout currentPage="gyms">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header Card */}
          <div className="mobile-card animate-fade-in">
            <div className="mobile-card-header">
              <div className="animate-slide-up">
                <h1 className="mobile-card-title">Bouldering Gyms</h1>
                <p className="mobile-card-subtitle">
                  Discover amazing bouldering gyms around the world
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mobile-card animate-slide-up">
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search gyms by name, city, or country..."
                  className="w-full minimal-input"
                />
              </div>
              <div>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full minimal-input"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gyms List */}
          <div className="mobile-section">
            {loading ? (
              <div className="mobile-card animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="loading-skeleton w-16 h-16 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="loading-skeleton h-4 w-3/4"></div>
                      <div className="loading-skeleton h-3 w-1/2"></div>
                      <div className="loading-skeleton h-3 w-2/3"></div>
                    </div>
                  </div>
                  <div className="loading-skeleton h-16 w-full"></div>
                  <div className="flex gap-2">
                    <div className="loading-skeleton h-6 w-20"></div>
                    <div className="loading-skeleton h-6 w-16"></div>
                    <div className="loading-skeleton h-6 w-18"></div>
                  </div>
                </div>
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="mobile-card">
                <div className="minimal-flex-center py-8">
                  <div className="text-center">
                    <MapPin className="minimal-icon mx-auto mb-2 text-gray-500" />
                    <p className="mobile-text-sm">No gyms found matching your search</p>
                  </div>
                </div>
              </div>
            ) : (
              filteredGyms.map((gym, index) => (
                <div 
                  key={gym.id} 
                  className={`mobile-card cursor-pointer touch-feedback animate-stagger-${Math.min(index + 1, 5)}`} 
                  onClick={() => openGym(gym)}
                >
                  <div className="mobile-card-header">
                    <div className="minimal-flex">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg minimal-flex-center mr-4 overflow-hidden">
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
                          <MapPin className="minimal-icon text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="mobile-subheading">{gym.name}</h3>
                        <div className="minimal-flex mobile-text-xs text-gray-400 mb-1">
                          <MapPin className="minimal-icon mr-1" />
                          <span>{gym.city}, {gym.country}</span>
                        </div>
                        <div className="minimal-flex mobile-text-xs text-gray-400">
                          <span>{gym.boulder_count} boulder problems</span>
                          <span className="mx-2">•</span>
                          <span>{gym.wall_height}</span>
                        </div>
                      </div>
                      <ChevronRight className="minimal-icon text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="mobile-card-content">
                    <p className="mobile-text-sm text-gray-300 mb-3">
                      {gym.description.length > 120 
                        ? `${gym.description.substring(0, 120)}...` 
                        : gym.description
                      }
                    </p>
                    
                    <div className="minimal-flex flex-wrap gap-2 mb-3">
                      {gym.facilities.slice(0, 4).map((facility, index) => {
                        const IconComponent = getFacilityIcon(facility);
                        return (
                          <span key={index} className="minimal-flex mobile-text-xs bg-gray-700 px-2 py-1 rounded">
                            <IconComponent className="w-3 h-3 mr-1" />
                            {facility}
                          </span>
                        );
                      })}
                      {gym.facilities.length > 4 && (
                        <span className="minimal-flex mobile-text-xs bg-gray-700 px-2 py-1 rounded">
                          +{gym.facilities.length - 4} more
                        </span>
                      )}
                    </div>
                    
                    <div className="minimal-flex-between">
                      <span className="minimal-text text-sm font-medium text-indigo-400">
                        {gym.price_range}
                      </span>
                      <div className="minimal-flex mobile-text-xs text-gray-400">
                        <Star className="minimal-icon mr-1" />
                        <span>Click for details</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gym Detail Modal */}
          {selectedGym && (
            <div className="fixed inset-0 bg-black bg-opacity-50 minimal-flex-center z-50">
              <div className="minimal-card p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="minimal-flex-between mb-4">
                  <h3 className="mobile-subheading">{selectedGym.name}</h3>
                  <button
                    onClick={closeGym}
                    className="mobile-btn-secondary"
                  >
                    <X className="minimal-icon" />
                  </button>
                </div>
                
                {/* Gym Image */}
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={selectedGym.image_url} 
                    alt={selectedGym.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full minimal-flex-center bg-gray-700" style={{display: 'none'}}>
                    <MapPin className="minimal-icon text-gray-400 text-4xl" />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="minimal-heading mb-3">Location</h4>
                    <div className="space-y-2">
                      <div className="minimal-flex">
                        <MapPin className="minimal-icon mr-2 text-gray-400" />
                        <span className="minimal-text text-sm">{selectedGym.address}</span>
                      </div>
                      <div className="minimal-flex">
                        <MapPin className="minimal-icon mr-2 text-gray-400" />
                        <span className="minimal-text text-sm">{selectedGym.city}, {selectedGym.country}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="minimal-heading mb-3">Contact</h4>
                    <div className="space-y-2">
                      {selectedGym.phone && (
                        <div className="minimal-flex">
                          <Phone className="minimal-icon mr-2 text-gray-400" />
                          <a href={`tel:${selectedGym.phone}`} className="minimal-text text-sm text-indigo-400 hover:text-indigo-300">
                            {selectedGym.phone}
                          </a>
                        </div>
                      )}
                      {selectedGym.email && (
                        <div className="minimal-flex">
                          <Mail className="minimal-icon mr-2 text-gray-400" />
                          <a href={`mailto:${selectedGym.email}`} className="minimal-text text-sm text-indigo-400 hover:text-indigo-300">
                            {selectedGym.email}
                          </a>
                        </div>
                      )}
                      {selectedGym.website && (
                        <div className="minimal-flex">
                          <Globe className="minimal-icon mr-2 text-gray-400" />
                          <a href={selectedGym.website} target="_blank" rel="noopener noreferrer" className="minimal-text text-sm text-indigo-400 hover:text-indigo-300">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="minimal-heading mb-3">About</h4>
                  <p className="minimal-text text-sm text-gray-300">{selectedGym.description}</p>
                </div>

                {/* Facilities */}
                <div className="mb-6">
                  <h4 className="minimal-heading mb-3">Facilities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedGym.facilities.map((facility, index) => {
                      const IconComponent = getFacilityIcon(facility);
                      return (
                        <div key={index} className="minimal-flex mobile-text-sm bg-gray-700 px-3 py-2 rounded">
                          <IconComponent className="w-4 h-4 mr-2 text-gray-400" />
                          {facility}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gym Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="minimal-heading mb-3">Gym Details</h4>
                    <div className="space-y-2">
                      <div className="minimal-flex-between">
                        <span className="minimal-text text-sm">Price Range:</span>
                        <span className="minimal-text text-sm font-medium text-indigo-400">{selectedGym.price_range}</span>
                      </div>
                      <div className="minimal-flex-between">
                        <span className="minimal-text text-sm">Wall Height:</span>
                        <span className="minimal-text text-sm">{selectedGym.wall_height}</span>
                      </div>
                      <div className="minimal-flex-between">
                        <span className="minimal-text text-sm">Boulder Problems:</span>
                        <span className="minimal-text text-sm">{selectedGym.boulder_count}</span>
                      </div>
                      <div className="minimal-flex-between">
                        <span className="minimal-text text-sm">Difficulty Levels:</span>
                        <span className="minimal-text text-sm">{selectedGym.difficulty_levels.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="minimal-heading mb-3">Opening Hours</h4>
                    <div className="space-y-1">
                      {formatOpeningHours(selectedGym.opening_hours)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
