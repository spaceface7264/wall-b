import React from 'react';
import { Users, MessageSquare, MapPin, Lock, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const isSuspended = community.is_active === false;
  const hasPrivacyIndicator = community.is_private !== undefined;
  
  return (
    <div 
      className="touch-feedback transition-all duration-200 relative w-full cursor-pointer flex flex-col"
      style={{ 
        minHeight: '100%', 
        height: '100%',
        opacity: isSuspended ? 0.75 : 1
      }}
      onClick={handleCardClick}
    >
      {/* Suspended Indicator - Top Left */}
      {isSuspended && (
        <div className="absolute top-0 left-0 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Suspended">
            <AlertCircle className="w-2.5 h-2.5" style={{ color: '#ef4444' }} aria-label="Suspended community" />
          </div>
        </div>
      )}
      
      {/* Privacy Indicator - Top Right */}
      {hasPrivacyIndicator && (
        <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
          {community.is_private ? (
            <div className="flex items-center justify-center px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Private">
              <Lock className="w-2.5 h-2.5" style={{ color: '#ef4444' }} aria-label="Private community" />
            </div>
          ) : (
            <div className="flex items-center justify-center px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 131, 246, 0.1)', border: '1px solid rgba(59, 131, 246, 0.3)' }} title="Public">
              <Globe className="w-2.5 h-2.5" style={{ color: '#3b82f6' }} aria-label="Public community" />
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
      
      <div className="flex-1 flex flex-col min-h-0" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Content Section - Takes available space */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0" style={{ 
              paddingRight: hasPrivacyIndicator ? '28px' : '0',
              paddingLeft: isSuspended ? '28px' : '0'
            }}>
              {/* Community Title */}
              <div className="mb-1">
                <h3 className="mobile-subheading truncate" style={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  color: isSuspended ? 'var(--text-muted)' : undefined
                }}>{community.name}</h3>
              </div>
              
              {/* Gym Name and City - Below Title */}
              {gym && (gym.city || gym.name) && (
                <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {gym.name && (
                    <span className="truncate" title={gym.name} style={{ color: 'var(--text-secondary)' }}>{gym.name}</span>
                  )}
                  {gym.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                      <span className="truncate" title={gym.city} style={{ color: 'var(--text-secondary)' }}>{gym.city}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mobile-text-xs line-clamp-2 mb-3 leading-relaxed flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
            {community.description}
          </p>
        </div>
        
        {/* Member/Post Indicators - Pushed to Bottom */}
        {!community.is_private && (
          <div className="flex items-center gap-4 mt-auto flex-shrink-0" style={{ marginTop: 'auto', paddingTop: '8px', paddingRight: isMember ? '32px' : '0' }}>
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
  );
});

export default CommunityCard;
