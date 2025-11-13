import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, MapPin, MessageSquare, User, Search as SearchIcon, Hash, Lock } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';
import ListSkeleton from '../components/ListSkeleton';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    communities: [],
    posts: [],
    users: [],
    gyms: []
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'communities', 'posts', 'users', 'gyms'
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults({ communities: [], posts: [], users: [], gyms: [] });
    }
  }, [debouncedQuery]);

  // Initialize search query from URL
  useEffect(() => {
    if (query && query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [query]);

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    const searchLower = searchTerm.toLowerCase().trim();

    try {
      // Search communities (including private communities)
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          member_count,
          gym_id,
          is_private,
          gyms (
            id,
            name,
            city,
            country
          )
        `)
        .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%`)
        .eq('is_active', true)
        .limit(10);

      // Search posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          like_count,
          comment_count,
          community_id,
          communities (
            id,
            name
          ),
          profiles (
            id,
            nickname,
            handle
          )
        `)
        .or(`title.ilike.%${searchLower}%,content.ilike.%${searchLower}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      // Search users/profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          nickname,
          handle,
          full_name,
          bio
        `)
        .or(`nickname.ilike.%${searchLower}%,handle.ilike.%${searchLower}%,full_name.ilike.%${searchLower}%,bio.ilike.%${searchLower}%`)
        .limit(10);

      // Search gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select(`
          id,
          name,
          city,
          country,
          address,
          description
        `)
        .or(`name.ilike.%${searchLower}%,city.ilike.%${searchLower}%,country.ilike.%${searchLower}%,address.ilike.%${searchLower}%,description.ilike.%${searchLower}%`)
        .limit(10);

      setResults({
        communities: communitiesData || [],
        posts: postsData || [],
        users: usersData || [],
        gyms: gymsData || []
      });

      if (communitiesError) console.error('Communities search error:', communitiesError);
      if (postsError) console.error('Posts search error:', postsError);
      if (usersError) console.error('Users search error:', usersError);
      if (gymsError) console.error('Gyms search error:', gymsError);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Error performing search', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setDebouncedQuery(searchQuery);
      setSearchParams({ q: searchQuery });
    }
  };

  const totalResults = useMemo(() => {
    return results.communities.length + results.posts.length + results.users.length + results.gyms.length;
  }, [results]);

  const filteredResults = useMemo(() => {
    if (activeTab === 'all') {
      return results;
    }
    return {
      communities: activeTab === 'communities' ? results.communities : [],
      posts: activeTab === 'posts' ? results.posts : [],
      users: activeTab === 'users' ? results.users : [],
      gyms: activeTab === 'gyms' ? results.gyms : []
    };
  }, [activeTab, results]);

  return (
    <div className="mobile-container">
      {/* Search Bar */}
      <div className="mobile-section mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, posts, users, gyms..."
            className="minimal-input w-full pl-10 pr-4"
            autoFocus
          />
        </form>
      </div>

      {/* Tabs */}
      {debouncedQuery && (
        <div className="mobile-section mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'communities'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Communities ({results.communities.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Posts ({results.posts.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Users ({results.users.length})
            </button>
            <button
              onClick={() => setActiveTab('gyms')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'gyms'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Gyms ({results.gyms.length})
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="mobile-section">
          <ListSkeleton variant="community" count={5} />
        </div>
      ) : debouncedQuery ? (
        <div className="mobile-section">
          {/* Communities Results */}
          {(activeTab === 'all' || activeTab === 'communities') && filteredResults.communities.length > 0 && (
            <div className="mb-6">
              <h2 className="minimal-heading mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Communities
              </h2>
              <div className="space-y-2">
                {filteredResults.communities.map((community) => {
                  const gym = community.gyms 
                    ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
                    : null;
                  return (
                    <button
                      key={community.id}
                      onClick={() => navigate(`/community/${community.id}`)}
                      className="mobile-card w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="mobile-subheading">{community.name}</h3>
                            {community.is_private && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Private community">
                                <Lock className="w-3 h-3" style={{ color: '#ef4444' }} />
                                <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Private</span>
                              </div>
                            )}
                          </div>
                          {community.description && (
                            <p className="mobile-text-xs text-gray-400 line-clamp-2 mb-2">
                              {community.description}
                            </p>
                          )}
                          {gym && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              <span>{gym.name} • {gym.city}, {gym.country}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {(activeTab === 'all' || activeTab === 'posts') && filteredResults.posts.length > 0 && (
            <div className="mb-6">
              <h2 className="minimal-heading mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Posts
              </h2>
              <div className="space-y-2">
                {filteredResults.posts.map((post) => {
                  const community = post.communities 
                    ? (Array.isArray(post.communities) ? post.communities[0] : post.communities)
                    : null;
                  const profile = post.profiles 
                    ? (Array.isArray(post.profiles) ? post.profiles[0] : post.profiles)
                    : null;
                  return (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/community/${post.community_id}/post/${post.id}`)}
                      className="mobile-card w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="mobile-subheading mb-1">{post.title}</h3>
                          {post.content && (
                            <p className="mobile-text-xs text-gray-400 line-clamp-2 mb-2">
                              {post.content}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {profile && (
                              <span>@{profile.handle || profile.nickname}</span>
                            )}
                            {community && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {community.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Results */}
          {(activeTab === 'all' || activeTab === 'users') && filteredResults.users.length > 0 && (
            <div className="mb-6">
              <h2 className="minimal-heading mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Users
              </h2>
              <div className="space-y-2">
                {filteredResults.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="mobile-card w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mobile-subheading mb-1">
                          {user.nickname || user.full_name || 'Unknown User'}
                        </h3>
                        {user.handle && (
                          <p className="mobile-text-xs text-gray-400">@{user.handle}</p>
                        )}
                        {user.bio && (
                          <p className="mobile-text-xs text-gray-500 mt-1 line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gyms Results */}
          {(activeTab === 'all' || activeTab === 'gyms') && filteredResults.gyms.length > 0 && (
            <div className="mb-6">
              <h2 className="minimal-heading mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Gyms
              </h2>
              <div className="space-y-2">
                {filteredResults.gyms.map((gym) => (
                  <button
                    key={gym.id}
                    onClick={() => navigate(`/gyms/${gym.id}`)}
                    className="mobile-card w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mobile-subheading mb-1">{gym.name}</h3>
                        {gym.description && (
                          <p className="mobile-text-xs text-gray-400 line-clamp-2 mb-2">
                            {gym.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{gym.city}, {gym.country}</span>
                        </div>
                        {gym.address && (
                          <p className="mobile-text-xs text-gray-500 mt-1">
                            {gym.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {totalResults === 0 && (
            <div className="mobile-card p-8 text-center">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="mobile-text" style={{ color: 'var(--text-muted)' }}>
                No results found for "{debouncedQuery}"
              </p>
              <p className="mobile-text-xs text-gray-500 mt-2">
                Try different keywords or check your spelling
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mobile-section">
          <div className="mobile-card p-8 text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="mobile-text" style={{ color: 'var(--text-muted)' }}>
              Search for communities, posts, users, or gyms
            </p>
            <p className="mobile-text-xs text-gray-500 mt-2">
              Enter a search term above to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

