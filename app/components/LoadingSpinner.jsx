/**
 * Loading Spinner Component
 * Used for route lazy loading fallbacks
 * Now uses logo with pulsing animation
 */
import { useState } from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const [logoError, setLogoError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-12',
    lg: 'h-16',
  }
  
  const spinnerSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {!logoError ? (
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className={`${sizeClasses[size]} w-auto animate-pulse object-contain`}
          style={{ maxWidth: '200px' }}
          onError={() => setLogoError(true)}
        />
      ) : (
        <div
          className={`${spinnerSizeClasses[size]} border-4 border-gray-700 border-t-accent-blue rounded-full animate-spin`}
      />
      )}
    </div>
  )
}

