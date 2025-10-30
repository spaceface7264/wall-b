import Skeleton from './Skeleton';

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-700/50">
        {/* Avatar */}
        <Skeleton variant="avatar" width={120} height={120} rounded="full" />
        
        {/* Name */}
        <Skeleton width={200} height={24} rounded="md" />
        
        {/* Bio */}
        <div className="w-full space-y-2 px-4">
          <Skeleton width="100%" height={16} />
          <Skeleton width="80%" height={16} />
        </div>
        
        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col items-center gap-1">
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={14} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={14} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={14} />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        <Skeleton width={150} height={20} rounded="md" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton width="100%" height={120} rounded="lg" />
          <Skeleton width="100%" height={120} rounded="lg" />
        </div>
      </div>
    </div>
  );
}

