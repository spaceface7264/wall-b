import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Shield, Settings, ArrowLeft, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import NotificationTest from '../components/NotificationTest';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [gymRequests, setGymRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_admin) {
        navigate('/communities');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/communities');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(usersData || []);

      // Load communities
      const { data: communitiesData } = await supabase
        .from('communities')
        .select(`
          *,
          gyms(name, city, country)
        `)
        .order('created_at', { ascending: false });
      setCommunities(communitiesData || []);

      // Load gym requests
      const { data: gymRequestsData } = await supabase
        .from('gym_requests')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      setGymRequests(gymRequestsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const makeAdmin = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh users list
      loadData();
    } catch (error) {
      console.error('Error making user admin:', error);
      alert('Failed to make user admin');
    }
  };

  const removeAdmin = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh users list
      loadData();
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin status');
    }
  };

  const makeCommunityAdmin = async (userId, communityId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .upsert({
          user_id: userId,
          community_id: communityId,
          role: 'admin'
        });
      
      if (error) throw error;
      
      alert('User made community admin successfully');
      loadData();
    } catch (error) {
      console.error('Error making community admin:', error);
      alert('Failed to make user community admin');
    }
  };

  const approveGymRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('gym_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user.id
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      alert('Gym request approved! You can now manually add the gym to the database.');
      loadData();
    } catch (error) {
      console.error('Error approving gym request:', error);
      alert('Failed to approve gym request');
    }
  };

  const rejectGymRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('gym_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user.id
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      alert('Gym request rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting gym request:', error);
      alert('Failed to reject gym request');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin access to view this page.</p>
          <button
            onClick={() => navigate('/communities')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/communities')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <Shield className="w-8 h-8 mr-3 text-cyan-400" />
                  Admin Panel
                </h1>
                <p className="text-slate-300 mt-1">Manage users, communities, and platform settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-300 font-medium">Admin Access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <div className="flex items-center">
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="ml-4">
                <p className="text-slate-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Settings className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-slate-400 text-sm font-medium">Communities</p>
                <p className="text-2xl font-bold text-white">{communities.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
            <div className="flex items-center">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div className="ml-4">
                <p className="text-slate-400 text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold text-white">{users.filter(u => u.is_admin).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Test */}
        <div className="mb-8">
          <NotificationTest userId={users.find(u => u.is_admin)?.id} />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-xl">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'communities'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Communities ({communities.length})
              </button>
              <button
                onClick={() => setActiveTab('gym-requests')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'gym-requests'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Gym Requests ({gymRequests.filter(r => r.status === 'pending').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/30">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-cyan-400" />
                User Management
              </h2>
              <p className="text-slate-300 mt-1">Manage user permissions and platform access</p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-700/20 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 relative">
                      {user.avatar_url ? (
                        <img
                          className="w-12 h-12 rounded-full border-2 border-slate-600"
                          src={user.avatar_url}
                          alt={user.full_name}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border-2 border-slate-600">
                          <span className="text-lg font-bold text-white">
                            {user.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      {user.is_admin && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <Shield className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Platform Admin
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {user.is_admin ? (
                      <button
                        onClick={() => removeAdmin(user.id)}
                        className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200"
                      >
                        Remove Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => makeAdmin(user.id)}
                        className="px-4 py-2 text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200"
                      >
                        Make Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/30">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-400" />
                Community Management
              </h2>
              <p className="text-slate-300 mt-1">Oversee all platform communities and their settings</p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {communities.map((community) => (
                <div key={community.id} className="px-6 py-5 hover:bg-slate-700/20 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {community.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {community.gyms?.name} - {community.gyms?.city}, {community.gyms?.country}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {community.member_count} members
                          </span>
                          <span className="text-xs text-slate-500">
                            Created {new Date(community.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1.5 text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-colors duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gym Requests Tab */}
        {activeTab === 'gym-requests' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/30">
              <h2 className="text-xl font-bold text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-amber-400" />
                Gym Requests Management
              </h2>
              <p className="text-slate-300 mt-1">Review and approve gym addition requests from users</p>
            </div>
            <div className="divide-y divide-slate-700/50">
              {gymRequests.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No gym requests found</p>
                </div>
              ) : (
                gymRequests.map((request) => (
                  <div key={request.id} className="px-6 py-5 hover:bg-slate-700/20 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {request.gym_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : request.status === 'approved'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Location</p>
                            <p className="text-white">{request.city}, {request.country}</p>
                            {request.address && (
                              <p className="text-sm text-slate-300">{request.address}</p>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Contact</p>
                            {request.phone && (
                              <p className="text-white text-sm">{request.phone}</p>
                            )}
                            {request.email && (
                              <p className="text-slate-300 text-sm">{request.email}</p>
                            )}
                            {request.website && (
                              <a 
                                href={request.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-cyan-400 text-sm hover:text-cyan-300"
                              >
                                {request.website}
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {request.description && (
                          <div className="mb-4">
                            <p className="text-sm text-slate-400 mb-1">Description</p>
                            <p className="text-slate-300 text-sm">{request.description}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div>
                            <p>Requested by: {request.profiles?.full_name || 'Unknown'} ({request.profiles?.email})</p>
                            <p>Submitted: {new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                          {request.reviewed_at && (
                            <div>
                              <p>Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => approveGymRequest(request.id)}
                            className="px-4 py-2 text-sm font-medium bg-green-600/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors duration-200 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectGymRequest(request.id)}
                            className="px-4 py-2 text-sm font-medium bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors duration-200 flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
