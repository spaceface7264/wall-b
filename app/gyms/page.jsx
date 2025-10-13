'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MapPin } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import GymCard from '../components/GymCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export default function Gyms() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const router = useRouter();

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
    console.log('Opening gym:', gym);
    console.log('Gym ID:', gym.id);
    router.push(`/gyms/${gym.id}`);
  };


  return (
    <SidebarLayout currentPage="gyms">
      <div className="mobile-container">
        {/* Header Card */}
        <div className="mobile-card animate-fade-in mb-6">
          <div className="mobile-card-header">
            <div className="animate-slide-up">
              <h1 className="mobile-card-title">Bouldering Gyms</h1>
              <p className="mobile-card-subtitle">
                Discover bouldering gyms around the world
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mobile-card animate-slide-up mb-6">
          <div className="space-y-2">
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
                />
              ))
            )}
        </div>
      </div>
    </SidebarLayout>
  );
}
