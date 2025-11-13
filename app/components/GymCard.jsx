import React from 'react';
import { MapPin, EyeOff, Users } from 'lucide-react';
import { formatDistance } from '../../lib/geolocation';

const GymCard = React.memo(function GymCard({
  gym,
  onOpen,
  isAdmin = false
}) {
  const facilities = Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]');

  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons - stop propagation so wrapper doesn't handle it
    if (e.target.closest('button')) {
      e.stopPropagation();
      return;
    }
    // For normal clicks, let the event bubble to the wrapper which handles navigation
    if (onOpen) {
      onOpen(gym);
    }
  };

  return (
    <div 
      className="touch-feedback transition-all duration-200 relative w-full cursor-pointer flex flex-col"
      style={{ minHeight: '100%', height: '100%' }}
      onClick={handleCardClick}
    >
      {/* Community Count Indicator - Top Right */}
      {(gym.community_count !== undefined && gym.community_count > 0) && (
        <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 131, 246, 0.1)', border: '1px solid rgba(59, 131, 246, 0.3)' }}>
            <Users className="w-3 h-3" style={{ color: '#3b82f6' }} />
            <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>{gym.community_count}</span>
          </div>
        </div>
      )}
      
      {/* Hidden Indicator - Below Community Count or Top Right */}
      {gym.is_hidden && isAdmin && (
        <div className="absolute z-10" style={{ top: (gym.community_count !== undefined && gym.community_count > 0) ? '28px' : '0', right: '0' }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <EyeOff className="w-3 h-3" style={{ color: '#f59e0b' }} />
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: '1 1 auto', minHeight: 0 }}>
        {/* Gym Logo */}
        <div 
          style={{ 
            flexShrink: 0, 
            width: '52px', 
            height: '52px',
            minWidth: '52px',
            minHeight: '52px',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px'
          }}
        >
          {(gym.logo_url || gym.logo) ? (
            <img
              src={gym.logo_url || gym.logo}
              alt={`${gym.name} logo`}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                console.error('❌ Failed to load gym logo for:', gym.name, 'URL:', gym.logo_url || gym.logo);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onLoad={() => {
                console.log('✅ Gym logo loaded successfully:', gym.name);
              }}
            />
          ) : null}
          <div 
            className="w-full h-full bg-gradient-to-br from-accent-blue to-accent-blue-hover minimal-flex-center"
            style={{ display: (gym.logo_url || gym.logo) ? 'none' : 'flex' }}
          >
            <span className="text-white font-semibold text-xl">
              {gym.name ? gym.name.charAt(0).toUpperCase() : 'G'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '100%', height: '100%' }}>
          <div className="flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0" style={{ paddingRight: ((gym.community_count !== undefined && gym.community_count > 0) || (gym.is_hidden && isAdmin)) ? '56px' : '0' }}>
                {/* Gym Title */}
                <div className="mb-0.5">
                  <h3 className="mobile-subheading truncate" style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}>{gym.name}</h3>
                </div>
                
                {/* Location - Below Title */}
                <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ width: '11px', height: '11px', color: 'var(--text-muted)' }} />
                  <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
                    {gym.city}{gym.country ? `, ${gym.country}` : ''}
                  </span>
                  {typeof gym.distance_km === 'number' && (
                    <>
                      <span className="flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>·</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {formatDistance(gym.distance_km)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <p className="mobile-text-xs line-clamp-2 mb-2 leading-relaxed flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              {gym.description}
            </p>
          </div>
          
          {/* Facilities - Bottom */}
          {facilities.length > 0 && (
            <div className="flex flex-wrap gap-1 flex-shrink-0 mt-auto" style={{ paddingTop: '4px' }}>
              {facilities.slice(0, 3).map((facility, index) => (
                <span 
                  key={index} 
                  className="mobile-text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    fontSize: '10px',
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    lineHeight: '1.2'
                  }}
                >
                  {facility}
                </span>
              ))}
              {facilities.length > 3 && (
                <span 
                  className="mobile-text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    fontSize: '10px',
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    lineHeight: '1.2'
                  }}
                >
                  +{facilities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GymCard;
