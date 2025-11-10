/**
 * Loading Spinner Component
 * Used for route lazy loading fallbacks
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-700 border-t-accent-blue rounded-full animate-spin`}
      />
    </div>
  )
}

