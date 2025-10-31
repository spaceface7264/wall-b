import Skeleton from './Skeleton';

export default function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={40} height={40} rounded="md" />
        <Skeleton width={200} height={24} rounded="md" />
        <Skeleton width={40} height={40} rounded="md" />
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center">
            <Skeleton width={32} height={32} rounded="md" className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton width="100%" height="100%" rounded="md" />
          </div>
        ))}
      </div>

      {/* Selected date events list */}
      <div className="mt-6 space-y-3">
        <Skeleton width={150} height={20} rounded="md" className="mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mobile-card">
            <div className="space-y-2">
              <Skeleton width="70%" height={18} />
              <Skeleton width="50%" height={14} />
              <Skeleton width="60%" height={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

