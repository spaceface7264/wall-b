import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Shield, Settings, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import NotificationTest from '../components/NotificationTest';
import AdminSkeleton from '../components/AdminSkeleton';
import SidebarLayout from '../components/SidebarLayout';

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
      // First, get the request data
      const { data: request, error: fetchError } = await supabase
        .from('gym_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) {
        alert('Gym request not found');
        return;
      }

      // Create the gym in the database (only fields that exist in the schema)
      const { data: newGym, error: createError } = await supabase
        .from('gyms')
        .insert({
          name: request.gym_name,
          country: request.country,
          city: request.city,
          address: request.address || '',
          phone: request.phone || null,
          email: request.email || null,
          website: request.website || null,
          description: request.description || null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating gym:', createError);
        alert(`Failed to create gym: ${createError.message}`);
        return;
      }

      console.log('Gym created successfully:', newGym);

      // Update the request status
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from('gym_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', requestId);
      
      if (updateError) {
        console.error('Error updating request status:', updateError);
        alert('Gym created but failed to update request status');
      } else {
        alert(`Gym "${request.gym_name}" approved and added to database!`);
      }
      
      loadData();
    } catch (error) {
      console.error('Error approving gym request:', error);
      alert(`Failed to approve gym request: ${error.message || 'Unknown error'}`);
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
      <SidebarLayout currentPage="admin">
        <div className="mobile-container">
          <div className="mobile-section">
            <AdminSkeleton />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SidebarLayout currentPage="admin">
        <div className="mobile-container">
          <div className="mobile-section">
            <div className="mobile-card">
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h1 className="minimal-heading mb-2">Access Denied</h1>
                <p className="mobile-text-sm mb-6">You need admin access to view this page.</p>
                <button
                  onClick={() => navigate('/communities')}
                  className="mobile-btn-primary"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="admin">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="mobile-card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="mobile-text-xs">Total Users</p>
                  <p className="text-xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="mobile-card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20">
                  <Settings className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="mobile-text-xs">Communities</p>
                  <p className="text-xl font-bold text-white">{communities.length}</p>
                </div>
              </div>
            </div>
            
            <div className="mobile-card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="mobile-text-xs">Admins</p>
                  <p className="text-xl font-bold text-white">{users.filter(u => u.is_admin).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Test */}
          <div className="mb-6">
            <NotificationTest userId={users.find(u => u.is_admin)?.id} />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="mobile-card-flat p-1 flex gap-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center py-2 px-3 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`flex-1 flex items-center justify-center py-2 px-3 font-medium text-sm transition-colors ${
                  activeTab === 'communities'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Communities ({communities.length})
              </button>
              <button
                onClick={() => setActiveTab('gym-requests')}
                className={`flex-1 flex items-center justify-center py-2 px-3 font-medium text-sm transition-colors ${
                  activeTab === 'gym-requests'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <MapPin className="w-4 h-4 mr-1.5" />
                Requests ({gymRequests.filter(r => r.status === 'pending').length})
              </button>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="mobile-card animate-fade-in">
              <div className="mb-4 pb-4 border-b border-gray-700">
                <h2 className="minimal-heading minimal-flex mb-1">
                  <Users className="minimal-icon mr-2 text-indigo-400" />
                  User Management
                </h2>
                <p className="mobile-text-sm">Manage user permissions and platform access</p>
              </div>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 relative">
                        {user.avatar_url ? (
                          <img
                            className="w-10 h-10 rounded-full border border-gray-600"
                            src={user.avatar_url}
                            alt={user.full_name}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-gray-600">
                            <span className="text-sm font-bold text-white">
                              {user.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        {user.is_admin && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center border border-gray-800">
                            <Shield className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mobile-subheading truncate">
                          {user.full_name || 'No name'}
                        </p>
                        <p className="mobile-text-xs truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.is_admin && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Shield className="w-2.5 h-2.5 mr-1" />
                              Admin
                            </span>
                          )}
                          <span className="mobile-text-xs">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {user.is_admin ? (
                        <button
                          onClick={() => removeAdmin(user.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => makeAdmin(user.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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
            <div className="mobile-card animate-fade-in">
              <div className="mb-4 pb-4 border-b border-gray-700">
                <h2 className="minimal-heading minimal-flex mb-1">
                  <Settings className="minimal-icon mr-2 text-indigo-400" />
                  Community Management
                </h2>
                <p className="mobile-text-sm">Oversee all platform communities and their settings</p>
              </div>
              <div className="space-y-3">
                {communities.map((community) => (
                  <div key={community.id} className="py-3 border-b border-gray-800 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="mobile-subheading truncate">
                            {community.name}
                          </h3>
                          <p className="mobile-text-xs truncate">
                            {community.gyms?.name} - {community.gyms?.city}, {community.gyms?.country}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {community.member_count} members
                            </span>
                            <span className="mobile-text-xs">
                              {new Date(community.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/community/${community.id}`)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 transition-colors flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gym Requests Tab */}
          {activeTab === 'gym-requests' && (
            <div className="mobile-card animate-fade-in">
              <div className="mb-4 pb-4 border-b border-gray-700">
                <h2 className="minimal-heading minimal-flex mb-1">
                  <MapPin className="minimal-icon mr-2 text-indigo-400" />
                  Gym Requests
                </h2>
                <p className="mobile-text-sm">Review and approve gym addition requests</p>
              </div>
              {gymRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="mobile-text-sm">No gym requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gymRequests.map((request) => (
                    <div key={request.id} className="pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="mobile-subheading truncate mb-2">
                            {request.gym_name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
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
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => approveGymRequest(request.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectGymRequest(request.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div>
                          <p className="mobile-text-xs mb-0.5">Location</p>
                          <p className="mobile-text-sm">{request.city}, {request.country}</p>
                          {request.address && (
                            <p className="mobile-text-xs text-gray-400 mt-0.5">{request.address}</p>
                          )}
                        </div>
                        
                        {(request.phone || request.email || request.website) && (
                          <div>
                            <p className="mobile-text-xs mb-0.5">Contact</p>
                            {request.phone && (
                              <p className="mobile-text-sm">{request.phone}</p>
                            )}
                            {request.email && (
                              <p className="mobile-text-xs text-gray-400">{request.email}</p>
                            )}
                            {request.website && (
                              <a 
                                href={request.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mobile-text-xs text-indigo-400 hover:text-indigo-300"
                              >
                                {request.website}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {request.description && (
                        <div className="mb-3">
                          <p className="mobile-text-xs mb-1">Description</p>
                          <p className="mobile-text-sm text-gray-300">{request.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mobile-text-xs text-gray-500 pt-2 border-t border-gray-800">
                        <div>
                          <p>By {request.profiles?.full_name || 'Unknown'}</p>
                          <p>{new Date(request.created_at).toLocaleDateString()}</p>
                        </div>
                        {request.reviewed_at && (
                          <p>Reviewed {new Date(request.reviewed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
