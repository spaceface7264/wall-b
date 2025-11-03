import Skeleton from './Skeleton';

export default function OnboardingSkeleton() {
  return (
    <div className="mobile-card space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="60%" height={24} rounded="md" />
        <Skeleton width="80%" height={16} />
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center space-y-4 py-4">
        <Skeleton variant="avatar" width={120} height={120} rounded="full" />
        <Skeleton width={150} height={16} />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={44} rounded="md" />
        </div>
        
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={44} rounded="md" />
        </div>

        <div>
          <Skeleton width={100} height={16} className="mb-2" />
          <Skeleton width="100%" height={100} rounded="md" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Skeleton width="100%" height={44} variant="button" />
      </div>
    </div>
  );
}

