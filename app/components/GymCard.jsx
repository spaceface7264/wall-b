import React from 'react';
import { MapPin, ChevronRight, EyeOff } from 'lucide-react';
import { formatDistance } from '../../lib/geolocation';

const GymCard = React.memo(function GymCard({
  gym,
  onOpen,
  isAdmin = false
}) {
  const facilities = Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]');


  return (
    <div
      className="cursor-pointer touch-feedback transition-all duration-200 w-full border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30"
      onClick={() => onOpen(gym)}
      style={{ padding: '16px 0', position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '0 16px' }}>
        {/* Gym Logo */}
          <div style={{ 
            flexShrink: 0, 
          width: '70px', 
          height: '70px',
          minWidth: '70px',
          minHeight: '70px',
            backgroundColor: '#1e1e1e',
            borderRadius: '4px',
            border: '1px solid #333333',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px'
          }}>
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
            <span className="text-white font-semibold text-2xl">
              {gym.name ? gym.name.charAt(0).toUpperCase() : 'G'}
            </span>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 className="mobile-subheading truncate" style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}>{gym.name}</h3>
            {gym.is_hidden && isAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 rounded">
                <EyeOff className="w-3 h-3" />
                Hidden
              </span>
            )}
            {typeof gym.distance_km === 'number' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{formatDistance(gym.distance_km)}</span>
              </div>
            )}
          </div>

          <div className="minimal-flex mobile-text-xs text-gray-400 items-center" style={{ marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <MapPin className="minimal-icon flex-shrink-0" style={{ marginRight: '4px' }} />
            <span className="truncate">{gym.city}, {gym.country}</span>
          </div>

          <p className="mobile-text-xs text-gray-300 line-clamp-2" style={{ lineHeight: '1.6', marginBottom: '6px' }}>
            {gym.description}
          </p>

          {/* Facilities */}
          {facilities.length > 0 && (
            <div className="minimal-flex flex-wrap gap-1">
              {facilities.slice(0, 3).map((facility, index) => (
                <span 
                  key={index} 
                  className="mobile-text-xs bg-gray-800/50 px-2 py-1 rounded text-gray-300"
                  style={{ fontSize: '10px' }}
                >
                  {facility}
                </span>
              ))}
              {facilities.length > 3 && (
                <span 
                  className="mobile-text-xs bg-gray-800/50 px-2 py-1 rounded text-gray-300"
                  style={{ fontSize: '10px' }}
                >
                  +{facilities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronRight className="minimal-icon text-gray-400" style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default GymCard;
