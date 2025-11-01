import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, Plus, MapPin, Calendar, MessageCircle, Building, Globe, AlertTriangle } from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import ReportCommunityModal from '../components/ReportCommunityModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../providers/ToastProvider';
import { enrichCommunitiesWithActualCounts } from '../../lib/community-utils';
import { EmptyCommunities } from '../components/EmptyState';
import ListSkeleton from '../components/ListSkeleton';

export default function CommunitiesPage() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Reload communities when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      loadCommunities();
      if (user) {
        loadMyCommunities(user.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      
      // First try with gyms relation
      let { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          gyms (
            name,
            city,
            country,
            address,
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      // If that fails (e.g., RLS issue with gyms), try without gyms relation
      if (error) {
        console.warn('Error loading communities with gyms relation:', error);
        console.log('Retrying without gyms relation...');
        
        const fallbackResult = await supabase
          .from('communities')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackResult.error) {
          console.error('Error loading communities:', fallbackResult.error);
          showToast('error', 'Error', `Failed to load communities: ${fallbackResult.error.message}`);
          return;
        }
        
        data = fallbackResult.data;
        error = null;
        
        // Fetch gym data separately for communities that have gym_id
        if (data && data.length > 0) {
          const gymIds = data
            .map(c => c.gym_id)
            .filter(Boolean)
            .filter((id, index, self) => self.indexOf(id) === index); // unique IDs
          
          if (gymIds.length > 0) {
            console.log('Fetching gym data for', gymIds.length, 'gyms:', gymIds);
            
            // Try fetching gyms one by one if batch fails (RLS might block .in())
            let gymsMap = {};
            
            // First try batch query
            const { data: gymsData, error: gymsError } = await supabase
              .from('gyms')
              .select('id, name, city, country, address')
              .in('id', gymIds);
            
            if (gymsError) {
              console.warn('Batch gym query failed, trying individual queries:', gymsError);
              console.error('Full error details:', JSON.stringify(gymsError, null, 2));
              
              // Fallback: fetch gyms individually
              for (const gymId of gymIds) {
                try {
                  console.log('Fetching individual gym:', gymId);
                  const { data: gymData, error: singleError } = await supabase
                    .from('gyms')
                    .select('id, name, city, country, address')
                    .eq('id', gymId)
                    .single();
                  
                  if (singleError) {
                    console.error(`Failed to fetch gym ${gymId}:`, singleError);
                  } else if (gymData) {
                    console.log('✅ Successfully fetched gym:', gymData.name);
                    gymsMap[gymData.id] = gymData;
                  }
                } catch (err) {
                  console.error('Exception fetching gym', gymId, err);
                }
              }
            } else if (gymsData) {
              // Batch query succeeded
              gymsData.forEach(gym => {
                gymsMap[gym.id] = gym;
              });
            }
            
            // Attach gym data to communities
            if (Object.keys(gymsMap).length > 0) {
              data = data.map(community => {
                const gym = community.gym_id && gymsMap[community.gym_id] ? gymsMap[community.gym_id] : null;
                return {
                  ...community,
                  gyms: gym ? [gym] : undefined
                };
              });
              
              console.log('Attached gym data to communities:', data.filter(c => c.gyms).length, 'communities have gym data');
            } else {
              console.warn('No gym data fetched for any communities');
            }
          }
        }
      }

      if (error) {
        console.error('Error loading communities:', error);
        showToast('error', 'Error', `Failed to load communities: ${error.message}`);
        return;
      }

      console.log('Loaded communities:', data?.length || 0, data);

      // Enrich communities with actual member counts
      const enrichedCommunities = await enrichCommunitiesWithActualCounts(data || []);
      console.log('Enriched communities:', enrichedCommunities?.length || 0, enrichedCommunities);
      setCommunities(enrichedCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
      showToast('error', 'Error', `Something went wrong: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCommunities = async (userId) => {
    try {
      // Try with nested gyms relation first
      let { data, error } = await supabase
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
            gym_id,
            gyms (
              name,
              city,
              country,
              image_url
            )
          )
        `)
        .eq('user_id', userId);

      // If nested query fails, fetch communities separately
      if (error) {
        console.warn('Error loading my communities with nested gyms:', error);
        
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', userId);

        if (membersError) {
          console.error('Error loading my communities:', membersError);
          return;
        }

        const communityIds = membersData?.map(m => m.community_id).filter(Boolean) || [];
        if (communityIds.length === 0) {
          setMyCommunities([]);
          return;
        }

        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, description, community_type, member_count, created_at, gym_id')
          .in('id', communityIds);

        if (communitiesError) {
          console.error('Error loading communities:', communitiesError);
          return;
        }

        data = communitiesData?.map(c => ({ community_id: c.id, communities: c })) || [];
        
        // Fetch gym data separately
        const gymIds = communitiesData
          ?.map(c => c.gym_id)
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index) || [];
        
        if (gymIds.length > 0) {
          console.log('Fetching gym data for my communities:', gymIds.length, 'gyms');
          
          // Try fetching gyms one by one if batch fails (RLS might block .in())
          let gymsMap = {};
          
          // First try batch query
          const { data: gymsData, error: gymsError } = await supabase
            .from('gyms')
            .select('id, name, city, country')
            .in('id', gymIds);
          
          if (gymsError) {
            console.warn('Batch gym query failed for my communities, trying individual queries:', gymsError);
            
            // Fallback: fetch gyms individually
            for (const gymId of gymIds) {
              try {
                const { data: gymData, error: singleError } = await supabase
                  .from('gyms')
                  .select('id, name, city, country')
                  .eq('id', gymId)
                  .single();
                
                if (!singleError && gymData) {
                  gymsMap[gymData.id] = gymData;
                }
              } catch (err) {
                console.warn('Failed to fetch gym', gymId, err);
              }
            }
          } else if (gymsData) {
            // Batch query succeeded
            gymsData.forEach(gym => {
              gymsMap[gym.id] = gym;
            });
          }
          
          // Attach gym data to communities
          if (Object.keys(gymsMap).length > 0) {
            data = data.map(item => {
              const gym = item.communities.gym_id && gymsMap[item.communities.gym_id] 
                ? gymsMap[item.communities.gym_id] 
                : null;
              return {
                ...item,
                communities: {
                  ...item.communities,
                  gyms: gym ? [gym] : undefined
                }
              };
            });
          }
        }
      }

      const myCommunitiesList = data?.map(item => item.communities).filter(Boolean) || [];
      // Enrich with actual member counts
      const enrichedMyCommunities = await enrichCommunitiesWithActualCounts(myCommunitiesList);
      setMyCommunities(enrichedMyCommunities);
    } catch (error) {
      console.error('Error loading my communities:', error);
    }
  };

  // Filter out invalid communities and communities the user has already joined
  const filteredCommunities = communities.filter(community => {
    // Safety checks for null/undefined values
    if (!community || !community.name) {
      return false;
    }
    // Exclude communities user is already a member of (they're shown in "My Communities")
    const isMember = myCommunities.some(c => c.id === community.id);
    return !isMember;
  });

  const [joiningCommunity, setJoiningCommunity] = useState(null);
  const [leavingCommunity, setLeavingCommunity] = useState(null);

  const handleJoinCommunity = async (communityId) => {
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to join communities');
      return;
    }

    setJoiningCommunity(communityId);
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
      await loadCommunities();
      if (user) {
        await loadMyCommunities(user.id);
      }
    } catch (error) {
      console.error('Error joining community:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setJoiningCommunity(null);
    }
  };


  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommunity, setReportingCommunity] = useState(null);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leavingCommunityId, setLeavingCommunityId] = useState(null);

  const handleLeaveCommunity = async (communityId) => {
    if (!user) {
      return;
    }

    setLeavingCommunityId(communityId);
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async () => {
    if (!user || !leavingCommunityId) {
      return;
    }

    setLeavingCommunity(leavingCommunityId);
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', leavingCommunityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving community:', error);
        showToast('error', 'Error', 'Failed to leave community');
        return;
      }

      showToast('success', 'Success', 'You have left the community');
      await loadCommunities();
      if (user) {
        await loadMyCommunities(user.id);
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      showToast('error', 'Error', 'Something went wrong');
    } finally {
      setLeavingCommunity(null);
      setLeavingCommunityId(null);
    }
  };

  const handleReportCommunity = async (communityId) => {
    const community = communities.find(c => c.id === communityId) || myCommunities.find(c => c.id === communityId);
    setReportingCommunity({ id: communityId, name: community?.name || 'Community' });
    setShowReportModal(true);
  };

  const handleReportModalClose = (success) => {
    setShowReportModal(false);
    setReportingCommunity(null);
    if (success) {
      showToast('success', 'Report Submitted', 'Thank you for reporting. Admins will review this community.');
    }
  };

  if (loading) {
    return (
        <div className="mobile-container">
          <div className="mobile-section">
            <ListSkeleton variant="community" count={6} />
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="mobile-container">
        <div className="mobile-section">
          {/* My Communities */}
          {myCommunities.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="minimal-heading mb-4 minimal-flex">
                <Users className="minimal-icon mr-2 text-indigo-400" />
                My Communities
              </h2>
              <div className="-mx-4 md:-mx-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                {myCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={true}
                    onJoin={handleJoinCommunity}
                    onLeave={handleLeaveCommunity}
                    onReport={handleReportCommunity}
                    onOpen={() => navigate(`/community/${community.id}`)}
                    leaving={leavingCommunity === community.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Communities */}
          <div className="animate-slide-up">
            <h2 className="minimal-heading mb-4 minimal-flex">
              <Globe className="minimal-icon mr-2 text-indigo-400" />
              All Communities
            </h2>
            
            {filteredCommunities.length === 0 ? (
              <EmptyCommunities onCreateClick={() => navigate('/community/new')} />
            ) : (
              <div className="-mx-4 md:-mx-6" style={{ marginLeft: 'calc(-1 * var(--container-padding-mobile))', marginRight: 'calc(-1 * var(--container-padding-mobile))' }}>
                {filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isMember={false}
                    onJoin={handleJoinCommunity}
                    onLeave={handleLeaveCommunity}
                    onReport={handleReportCommunity}
                    onOpen={() => navigate(`/community/${community.id}`)}
                    joining={joiningCommunity === community.id}
                    leaving={leavingCommunity === community.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && reportingCommunity && (
        <ReportCommunityModal
          isOpen={showReportModal}
          onClose={handleReportModalClose}
          communityId={reportingCommunity.id}
          communityName={reportingCommunity.name}
        />
      )}

      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setLeavingCommunityId(null);
        }}
        onConfirm={handleConfirmLeave}
        title="Leave Community"
        message="Are you sure you want to leave this community? You will no longer be able to see posts or participate in discussions."
        confirmText="Leave"
        cancelText="Cancel"
        icon={AlertTriangle}
        variant="warning"
      />
    </>
  );
}
