import Skeleton from './Skeleton';

export default function GymCardSkeleton() {
  return (
    <div
      className="w-full border-b border-gray-700/50 last:border-b-0 animate-fade-in"
      style={{ padding: '16px 0' }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '0 16px' }}>
        {/* Gym Logo Skeleton */}
        <div style={{ 
          flexShrink: 0, 
          width: '70px', 
          height: '70px',
          minWidth: '70px',
          minHeight: '70px',
        }}>
          <Skeleton width="70px" height="70px" rounded="md" />
        </div>
        
        {/* Content Skeleton */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title and distance */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width="60%" height={18} rounded="md" />
            <Skeleton width={60} height={20} rounded="md" />
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-1 mb-2">
            <Skeleton width={16} height={16} rounded="md" />
            <Skeleton width="50%" height={14} rounded="md" />
          </div>
          
          {/* Description */}
          <Skeleton width="90%" height={14} rounded="md" className="mb-1" />
          <Skeleton width="75%" height={14} rounded="md" className="mb-2" />
          
          {/* Facilities */}
          <div className="flex gap-1 flex-wrap">
            <Skeleton width={60} height={20} rounded="md" />
            <Skeleton width={70} height={20} rounded="md" />
            <Skeleton width={55} height={20} rounded="md" />
          </div>
        </div>

        {/* Chevron Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
          <Skeleton width={16} height={16} rounded="md" />
        </div>
      </div>
    </div>
  );
}

