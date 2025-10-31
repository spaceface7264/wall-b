import Skeleton from './Skeleton';

export default function GymDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header image */}
      <Skeleton width="100%" height={200} rounded="lg" className="mb-4" />

      {/* Title and favorite button */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={28} rounded="md" />
          <Skeleton width="50%" height={16} />
        </div>
        <Skeleton width={40} height={40} rounded="md" />
      </div>

      {/* Tab navigation skeleton */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-2">
        <Skeleton width={100} height={36} rounded="md" />
        <Skeleton width={120} height={36} rounded="md" />
        <Skeleton width={100} height={36} rounded="md" />
      </div>

      {/* Content area */}
      <div className="space-y-4">
        {/* About tab content */}
        <div className="space-y-4">
          <Skeleton width="100%" height={16} />
          <Skeleton width="95%" height={16} />
          <Skeleton width="90%" height={16} />
          
          {/* Info rows */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <Skeleton width={20} height={20} rounded="md" />
              <Skeleton width={200} height={16} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton width={20} height={20} rounded="md" />
              <Skeleton width={180} height={16} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton width={20} height={20} rounded="md" />
              <Skeleton width={160} height={16} />
            </div>
          </div>

          {/* Facilities */}
          <div className="pt-4">
            <Skeleton width={100} height={20} className="mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton width={80} height={28} rounded="md" />
              <Skeleton width={90} height={28} rounded="md" />
              <Skeleton width={70} height={28} rounded="md" />
              <Skeleton width={100} height={28} rounded="md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

