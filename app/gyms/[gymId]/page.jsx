'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Clock, Phone, Mail, Globe, Star, ArrowLeft, Wifi, Car, Coffee, Dumbbell, Users, Shield, Heart, Share2, MessageCircle } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function GymDetail() {
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.gymId) {
      fetchGym(params.gymId);
    }
  }, [params.gymId]);

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
            id: 1,
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
        
        const foundGym = mockGyms.find(gym => gym.id.toString() === gymId.toString());
        if (foundGym) {
          setGym(foundGym);
        } else {
          setGym(null);
        }
      } else {
        setGym(data);
      }
    } catch (error) {
      console.error('Error fetching gym:', error);
      setGym(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    // Simulate API call
    setTimeout(() => {
      setConnected(!connected);
      setConnecting(false);
    }, 1000);
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
      <SidebarLayout currentPage="gyms">
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
      <SidebarLayout currentPage="gyms">
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

  return (
    <SidebarLayout currentPage="gyms">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header with Back Button */}
          <div className="mobile-card animate-fade-in">
            <div className="minimal-flex-between items-center mb-4">
              <button 
                onClick={() => router.back()}
                className="mobile-btn-secondary minimal-flex"
              >
                <ArrowLeft className="minimal-icon mr-2" />
                Back
              </button>
              <div className="minimal-flex gap-2">
                <button className="mobile-btn-secondary">
                  <Share2 className="minimal-icon" />
                </button>
                <button className="mobile-btn-secondary">
                  <Heart className="minimal-icon" />
                </button>
              </div>
            </div>
            
            <div className="minimal-flex-between items-start">
              <div className="flex-1">
                <h1 className="mobile-card-title text-2xl mb-2">{gym.name}</h1>
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
            </div>
          </div>

          {/* Gym Image */}
          <div className="mobile-card animate-slide-up">
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
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="mobile-card-flat p-4 text-center">
              <div className="minimal-heading text-2xl text-indigo-400">{gym.boulder_count}</div>
              <div className="minimal-text text-xs text-gray-400">Boulder Problems</div>
            </div>
            <div className="mobile-card-flat p-4 text-center">
              <div className="minimal-heading text-2xl text-indigo-400">{gym.wall_height}</div>
              <div className="minimal-text text-xs text-gray-400">Wall Height</div>
            </div>
            <div className="mobile-card-flat p-4 text-center">
              <div className="minimal-heading text-2xl text-indigo-400">{gym.price_range}</div>
              <div className="minimal-text text-xs text-gray-400">Price Range</div>
            </div>
          </div>

          {/* Connect Button */}
          <div className="mobile-card animate-slide-up mb-6">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className={`w-full mobile-btn-primary text-center ${
                connected ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              {connecting ? (
                <div className="minimal-flex-center">
                  <div className="minimal-spinner mr-2"></div>
                  {connected ? 'Disconnecting...' : 'Connecting...'}
                </div>
              ) : (
                <div className="minimal-flex-center">
                  <MessageCircle className="minimal-icon mr-2" />
                  {connected ? 'Connected' : 'Connect with Gym'}
                </div>
              )}
            </button>
            {connected && (
              <p className="minimal-text text-sm text-center mt-2 text-green-400">
                You're now connected! You can receive updates and communicate with this gym.
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="mobile-card-flat p-4">
              <h4 className="minimal-heading mb-4 minimal-flex">
                <MapPin className="minimal-icon mr-2 text-indigo-400" />
                Location
              </h4>
              <div className="space-y-3">
                <div className="minimal-flex">
                  <MapPin className="minimal-icon mr-3 text-gray-400" />
                  <span className="minimal-text text-sm">{gym.address}</span>
                </div>
                <div className="minimal-flex">
                  <MapPin className="minimal-icon mr-3 text-gray-400" />
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
          <div className="mobile-card-flat p-4 mb-6">
            <h4 className="minimal-heading mb-4 minimal-flex">
              <Star className="minimal-icon mr-2 text-indigo-400" />
              About
            </h4>
            <p className="minimal-text text-sm text-gray-300 leading-relaxed">{gym.description}</p>
          </div>

          {/* Facilities */}
          <div className="mobile-card-flat p-4 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
      </div>
    </SidebarLayout>
  );
}

