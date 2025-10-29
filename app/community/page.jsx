import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, MapPin, Calendar, MessageCircle, Search, Filter, Building, Globe } from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import { useToast } from '../providers/ToastProvider';

export default function CommunitiesPage() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [myCommunities, setMyCommunities] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          loadMyCommunities(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUser();
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading communities:', error);
        showToast('error', 'Error', 'Failed to load communities');
        return;
      }

      setCommunities(data || []);
    } catch (error) {
      console.error('Error loading communities:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const loadMyCommunities = async (userId) => {
    try {
      const { data, error } = await supabase
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
            gyms (
              name,
              city,
              country
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading my communities:', error);
        return;
      }

      setMyCommunities(data?.map(item => item.communities).filter(Boolean) || []);
    } catch (error) {
      console.error('Error loading my communities:', error);
    }
  };

  const filteredCommunities = communities.filter(community => {
    // Safety checks for null/undefined values
    if (!community || !community.name) {
      return false;
    }
    
    const name = (community.name || '').toLowerCase();
    const description = (community.description || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = name.includes(searchLower) || description.includes(searchLower);
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'gym' && community.community_type === 'gym') ||
                         (filterType === 'general' && community.community_type === 'general');
    
    return matchesSearch && matchesFilter;
  });

  const handleJoinCommunity = async (communityId) => {
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

      showToast('success', 'Success', 'Joined community successfully!');
      loadMyCommunities(user.id);
    } catch (error) {
      console.error('Error joining community:', error);
      showToast('error', 'Error', 'Something went wrong');
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="mobile-section">
          <div className="mobile-card animate-fade-in">
            <div className="minimal-flex-center py-8">
              <div className="minimal-spinner"></div>
              <p className="minimal-text ml-3">Loading communities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header */}
          <div className="mobile-card animate-fade-in">
            <div className="minimal-flex-between items-center mb-4">
              <div className="flex-1">
                <p className="mobile-text-sm text-gray-300">
                  Connect with climbers and share your passion
                </p>
              </div>
              <button
                onClick={() => navigate('/community/new')}
                className="mobile-btn-primary minimal-flex gap-2 ml-4"
              >
                <Plus className="minimal-icon" />
                Create
              </button>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('gym')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterType === 'gym'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Building className="w-4 h-4 inline mr-1" />
                  Gym
                </button>
                <button
                  onClick={() => setFilterType('general')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterType === 'general'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-1" />
                  General
                </button>
              </div>
            </div>
          </div>

          {/* My Communities */}
          {myCommunities.length > 0 && (
            <div className="mobile-card animate-slide-up">
              <h2 className="minimal-heading mb-4 minimal-flex">
                <Users className="minimal-icon mr-2 text-indigo-400" />
                My Communities
              </h2>
              <div className="space-y-3">
                {myCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={true}
                    onLeave={() => {}}
                    onOpen={() => navigate(`/community/${community.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Communities */}
          <div className="mobile-card animate-slide-up">
            <h2 className="minimal-heading mb-4 minimal-flex">
              <Globe className="minimal-icon mr-2 text-indigo-400" />
              All Communities
            </h2>
            
            {filteredCommunities.length === 0 ? (
              <div className="minimal-flex-center py-12">
                <div className="text-center">
                  <Users className="minimal-icon mx-auto mb-4 text-gray-500 text-4xl" />
                  <p className="mobile-text-sm text-gray-400 mb-2">No communities found</p>
                  <p className="mobile-text-xs text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a community!'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={myCommunities.some(c => c.id === community.id)}
                    onLeave={() => {}}
                    onOpen={() => navigate(`/community/${community.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
