import React from 'react';
import { Users, MessageSquare, MapPin, Lock, Globe, CheckCircle2 } from 'lucide-react';

const CommunityCard = React.memo(function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onLeave,
  onReport,
  onOpen,
  joining = false,
  leaving = false
}) {
  // Get gym data - Supabase returns nested relations as arrays
  // If gyms is an array, get the first element; otherwise use it directly if it's an object
  const gymData = community.gyms 
    ? (Array.isArray(community.gyms) ? community.gyms[0] : community.gyms)
    : null;
  
  // Debug: Log gym data for communities with gym_id
  if (community.gym_id) {
    console.log('🔍 CommunityCard DEBUG:', {
      communityName: community.name,
      gym_id: community.gym_id,
      gyms: community.gyms,
      gymData: gymData,
      hasGymName: !!gymData?.name,
      gymName: gymData?.name
    });
  }
  
  // Post count (might come from query)
  const postCount = community.post_count || community.posts_count || 0;
  
  // Check if community is connected to a gym
  const gym = gymData;
  
  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons - stop propagation so wrapper doesn't handle it
    if (e.target.closest('button')) {
      e.stopPropagation();
      return;
    }
    // For normal clicks, let the event bubble to the wrapper which handles navigation
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(community.id);
    }
  };

  return (
    <div 
      className="touch-feedback transition-all duration-200 relative w-full cursor-pointer flex flex-col"
      style={{ minHeight: '100%', height: '100%' }}
      onClick={handleCardClick}
    >
      {/* Privacy Indicator - Top Right */}
      {community.is_private !== undefined && (
        <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
          {community.is_private ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Lock className="w-3 h-3" style={{ color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Private</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 131, 246, 0.1)', border: '1px solid rgba(59, 131, 246, 0.3)' }}>
              <Globe className="w-3 h-3" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>Public</span>
            </div>
          )}
        </div>
      )}
      
      {/* Joined Indicator - Bottom Right */}
      {isMember && (
        <div className="absolute bottom-0 right-0 z-10" style={{ paddingBottom: '8px', paddingRight: '8px' }} onClick={(e) => e.stopPropagation()}>
          <CheckCircle2 
            className="flex-shrink-0" 
            style={{ 
              width: '16px', 
              height: '16px', 
              color: 'var(--accent-blue)',
              opacity: 0.7
            }} 
          />
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: '1 1 auto', minHeight: 0 }}>
        <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '100%', height: '100%' }}>
          <div className="flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0" style={{ paddingRight: community.is_private !== undefined ? '80px' : '0' }}>
                {/* Community Title */}
                <div className="mb-1">
                  <h3 className="mobile-subheading truncate" style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}>{community.name}</h3>
                </div>
                
                {/* City and Gym - Below Title */}
                {gym && (gym.city || gym.name) && (
                  <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {gym.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                        <span className="truncate" title={gym.city} style={{ color: 'var(--text-secondary)' }}>{gym.city}</span>
                      </div>
                    )}
                    {gym.city && gym.name && (
                      <span className="flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>·</span>
                    )}
                    {gym.name && (
                      <span className="truncate" title={gym.name} style={{ color: 'var(--text-secondary)' }}>{gym.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="mobile-text-xs line-clamp-2 mb-3 leading-relaxed flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              {community.description}
            </p>
          </div>
          
          {/* Hide member/message counts for private communities */}
          {!community.is_private && (
            <div className="flex items-center gap-4 mt-auto flex-shrink-0" style={{ marginTop: 'auto', paddingRight: isMember ? '32px' : '0' }}>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{community.member_count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{postCount || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CommunityCard;
