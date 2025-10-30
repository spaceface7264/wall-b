import React from 'react';
import { MapPin, Star, Clock, Users, ChevronRight, Heart } from 'lucide-react';
import { formatDistance } from '../../lib/geolocation';

const GymCard = React.memo(function GymCard({
  gym,
  onOpen,
  isFavorite = false,
  onToggleFavorite
}) {
  const getFacilityIcon = (facility) => {
    const iconMap = {
      'Cafe': '☕',
      'Shop': '🛍️',
      'Training Area': '💪',
      'Yoga Studio': '🧘',
      'Kids Area': '👶',
      'Locker Rooms': '🔒',
      'Parking': '🚗',
      'Equipment Rental': '🎒',
      'Sauna': '🧖',
      'Massage': '💆',
      'Bike Storage': '🚲'
    };
    return iconMap[facility] || '🏢';
  };

  const facilities = Array.isArray(gym.facilities) ? gym.facilities : JSON.parse(gym.facilities || '[]');


  return (
    <div
      className="mobile-card cursor-pointer touch-feedback hover:border-indigo-500/50 transition-all duration-200"
      onClick={() => onOpen(gym)}
      style={{ padding: '20px', marginBottom: '16px', position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Gym Image */}
        {(gym.image_url || gym.image) && (
          <div style={{ 
            flexShrink: 0, 
            width: '120px', 
            height: '120px',
            minWidth: '120px',
            minHeight: '120px',
            backgroundColor: '#1e1e1e',
            borderRadius: '4px',
            border: '1px solid #333333',
            overflow: 'hidden'
          }}>
            <img
              src={gym.image_url || gym.image}
              alt={gym.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                console.error('❌ Failed to load gym image for:', gym.name, 'URL:', gym.image_url || gym.image);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ Gym image loaded successfully:', gym.name);
              }}
            />
          </div>
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="mobile-subheading truncate" style={{ marginBottom: '12px' }}>{gym.name}</h3>

          <div className="minimal-flex mobile-text-xs text-gray-400" style={{ marginBottom: '12px' }}>
            <MapPin className="minimal-icon flex-shrink-0" style={{ marginRight: '10px' }} />
            <span className="truncate">{gym.city}, {gym.country}</span>
            {typeof gym.distance_km === 'number' && (
              <span className="ml-2 text-indigo-300 whitespace-nowrap">• {formatDistance(gym.distance_km)} away</span>
            )}
          </div>

          <p className="mobile-text-xs text-gray-300 line-clamp-2" style={{ lineHeight: '1.7' }}>
            {gym.description}
          </p>

          {/* Facilities */}
          {facilities.length > 0 && (
            <div className="minimal-flex flex-wrap gap-1 mt-3">
              {facilities.slice(0, 3).map((facility, index) => (
                <span 
                  key={index} 
                  className="mobile-text-xs bg-gray-700 px-2 py-1 rounded text-gray-300"
                  style={{ fontSize: '10px' }}
                >
                  {getFacilityIcon(facility)} {facility}
                </span>
              ))}
              {facilities.length > 3 && (
                <span 
                  className="mobile-text-xs bg-gray-700 px-2 py-1 rounded text-gray-300"
                  style={{ fontSize: '10px' }}
                >
                  +{facilities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
          {/* Heart Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(gym.id);
            }}
            className={`mobile-touch-target p-2 rounded-full transition-all duration-200 ${
              isFavorite 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-red-400'
            }`}
            style={{ marginBottom: '8px' }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`minimal-icon transition-all duration-200 ${
                isFavorite ? 'fill-current' : ''
              }`} 
              style={{ width: '18px', height: '18px' }} 
            />
          </button>

          <div className="minimal-flex mobile-text-xs text-indigo-400" style={{ marginBottom: '8px' }}>
            <span className="font-medium">{gym.price_range}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronRight className="minimal-icon text-gray-400" style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default GymCard;
