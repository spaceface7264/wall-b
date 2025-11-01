import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { formatDistance } from '../../lib/geolocation';

const GymCard = React.memo(function GymCard({
  gym,
  onOpen
}) {
  const facilities = Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]');


  return (
    <div
      className="cursor-pointer touch-feedback transition-all duration-200 w-full border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30"
      onClick={() => onOpen(gym)}
      style={{ padding: '16px 0', position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '0 16px' }}>
        {/* Gym Image */}
          <div style={{ 
            flexShrink: 0, 
          width: '100px', 
          height: '100px',
          minWidth: '100px',
          minHeight: '100px',
            backgroundColor: '#1e1e1e',
            borderRadius: '4px',
            border: '1px solid #333333',
          overflow: 'hidden',
          position: 'relative'
          }}>
          {(gym.image_url || gym.image) ? (
            <img
              src={gym.image_url || gym.image}
              alt={gym.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: gym.image_focal_x !== undefined && gym.image_focal_y !== undefined
                  ? `${gym.image_focal_x * 100}% ${gym.image_focal_y * 100}%`
                  : 'center',
                display: 'block'
              }}
              onError={(e) => {
                console.error('❌ Failed to load gym image for:', gym.name, 'URL:', gym.image_url || gym.image);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onLoad={() => {
                console.log('✅ Gym image loaded successfully:', gym.name);
              }}
            />
          ) : null}
          <div 
            className="w-full h-full bg-gradient-to-br from-[#087E8B] to-[#087E8B] minimal-flex-center"
            style={{ display: (gym.image_url || gym.image) ? 'none' : 'flex' }}
          >
            <span className="text-white font-semibold text-2xl">
              {gym.name ? gym.name.charAt(0).toUpperCase() : 'G'}
            </span>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 className="mobile-subheading truncate" style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}>{gym.name}</h3>
            {typeof gym.distance_km === 'number' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{formatDistance(gym.distance_km)}</span>
              </div>
            )}
          </div>

          <div className="minimal-flex mobile-text-xs text-gray-400 items-center" style={{ marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
            <MapPin className="minimal-icon flex-shrink-0" style={{ marginRight: '6px' }} />
            <span className="truncate">{gym.city}, {gym.country}</span>
          </div>

          <p className="mobile-text-xs text-gray-300 line-clamp-2" style={{ lineHeight: '1.7', marginBottom: '8px' }}>
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
