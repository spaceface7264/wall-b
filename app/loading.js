import Skeleton from './components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-[800px] mx-auto p-4">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton width={120} height={28} rounded="md" />
            <Skeleton variant="avatar" width={40} height={40} rounded="full" />
          </div>
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            <Skeleton width="100%" height={200} rounded="lg" />
            <Skeleton width="100%" height={200} rounded="lg" />
            <Skeleton width="100%" height={200} rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
