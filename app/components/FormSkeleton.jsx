import Skeleton from './Skeleton';

export default function FormSkeleton({ fieldCount = 4 }) {
  return (
    <div className="space-y-6">
      {/* Form title */}
      <Skeleton width="60%" height={24} rounded="md" />
      
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: fieldCount }).map((_, i) => (
          <div key={i}>
            {/* Label */}
            <Skeleton width={100} height={16} className="mb-2" />
            
            {/* Input field */}
            <Skeleton width="100%" height={44} rounded="md" />
            
            {/* Optional helper text */}
            {i % 3 === 0 && (
              <Skeleton width="70%" height={12} className="mt-1" />
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="flex gap-3 pt-4">
        <Skeleton width={120} height={44} variant="button" />
        <Skeleton width={100} height={44} variant="button" />
      </div>
    </div>
  );
}

