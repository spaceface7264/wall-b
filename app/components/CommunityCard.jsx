import React, { useState, useRef, useEffect } from 'react';
import { Users, MessageSquare, UserPlus, Check, MoreVertical, LogOut, Flag } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
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
  
  // Get image from gym relation if available
  const imageUrl = gymData?.image_url || community.image_url;
  
  // Get tags from community tags or post tags
  const tags = community.tags || [];
  
  // Post count (might come from query)
  const postCount = community.post_count || community.posts_count || 0;
  
  // Check if community is connected to a gym
  const gym = gymData;
  const isGymCommunity = (gym && gym.name) || community.gym_id || community.community_type === 'gym';
  
  // Get tag colors if available
  const getTagColor = (tag) => {
    if (community.tag_colors && community.tag_colors[tag]) {
      return community.tag_colors[tag];
    }
    return '#3b82f6'; // Default blue
  };
  
  // Get country flag emoji
  const getCountryFlag = (country) => {
    const flagMap = {
      'United Kingdom': '🇬🇧',
      'UK': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Austria': '🇦🇹',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'China': '🇨🇳',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'Portugal': '🇵🇹',
      'Greece': '🇬🇷',
      'Turkey': '🇹🇷',
      'Russia': '🇷🇺',
      'India': '🇮🇳',
      'Singapore': '🇸🇬',
      'Thailand': '🇹🇭',
      'New Zealand': '🇳🇿',
      'Ireland': '🇮🇪',
    };
    return flagMap[country] || '🌍';
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons or menu
    if (e.target.closest('button') || e.target.closest('[role="menu"]')) {
      return;
    }
    onOpen(community.id);
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(community.id);
    }
  };

  const handleLeave = () => {
    setShowMenu(false);
    if (onLeave) {
      onLeave(community.id);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    if (onReport) {
      onReport(community.id);
    }
  };

  return (
    <div 
      className="mobile-card touch-feedback hover:border-indigo-500/50 transition-all duration-200 relative"
      onClick={handleCardClick}
      style={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Community Image */}
        {imageUrl && (
          <div style={{ 
            flexShrink: 0, 
            width: '100px', 
            height: '100px',
            minWidth: '100px',
            minHeight: '100px',
            backgroundColor: '#1e1e1e',
            borderRadius: '4px',
            border: '1px solid #333333',
            overflow: 'hidden'
          }}>
            <img
              src={imageUrl}
              alt={community.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="mobile-subheading truncate flex-1">{community.name}</h3>
            {gym && gym.name && (
              <div className="flex items-center gap-1.5 flex-shrink-0" style={{ fontSize: '12px', color: '#9ca3af' }}>
                {gym.country && (
                  <span className="text-base" title={gym.country}>{getCountryFlag(gym.country)}</span>
                )}
                <span className="truncate max-w-[120px]" title={gym.name}>{gym.name}</span>
              </div>
            )}
            
            {/* 3-Dot Menu - Inside card header */}
            <div className="relative flex-shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMember && (
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      {leaving ? 'Leaving...' : 'Leave Community'}
                    </button>
                  )}
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    role="menuitem"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mobile-text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed">
            {community.description}
          </p>
          
          <div className="minimal-flex mobile-text-xs text-gray-400 mb-2" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <div className="minimal-flex">
              <Users className="minimal-icon mr-1.5 flex-shrink-0" />
              <span className="font-medium">{community.member_count || 0} members</span>
            </div>
            {postCount > 0 && (
              <div className="minimal-flex">
                <MessageSquare className="minimal-icon mr-1.5 flex-shrink-0" style={{ width: '14px', height: '14px' }} />
                <span className="font-medium">{postCount} {postCount === 1 ? 'post' : 'posts'}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="minimal-flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="mobile-text-xs px-2 py-1 rounded text-gray-300"
                  style={{ 
                    fontSize: '10px',
                    backgroundColor: `${getTagColor(tag)}20`,
                    border: `1px solid ${getTagColor(tag)}40`,
                    color: getTagColor(tag)
                  }}
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span 
                  className="mobile-text-xs px-2 py-1 rounded text-gray-400"
                  style={{ fontSize: '10px', backgroundColor: '#1e1e1e' }}
                >
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {/* Join/Joined Button */}
            {isMember ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md text-xs font-medium cursor-default"
              >
                <Check className="w-3.5 h-3.5" />
                Joined
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Join
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CommunityCard;
