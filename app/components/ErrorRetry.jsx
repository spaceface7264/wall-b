

import { useState } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export default function ErrorRetry({ 
  error, 
  onRetry, 
  title = "Something went wrong", 
  description = "An error occurred while loading data. Please try again.",
  showNetworkStatus = true 
}) {
  const [retrying, setRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const getErrorIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />;
    }
    return <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />;
  };

  const getErrorMessage = () => {
    if (!isOnline) {
      return {
        title: "No Internet Connection",
        description: "Please check your internet connection and try again."
      };
    }

    if (error?.code === 'PGRST301') {
      return {
        title: "Database Error",
        description: "There was an issue connecting to the database. Please try again in a moment."
      };
    }

    if (error?.code === 'PGRST116') {
      return {
        title: "Permission Denied",
        description: "You don't have permission to access this content. Please contact support if this continues."
      };
    }

    if (error?.message?.includes('timeout')) {
      return {
        title: "Request Timeout",
        description: "The request took too long to complete. Please check your connection and try again."
      };
    }

    return {
      title,
      description: error?.message || description
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="minimal-flex-center h-64">
      <div className="text-center max-w-md mx-auto px-4">
        {getErrorIcon()}
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {errorInfo.title}
        </h3>
        
        <p className="text-gray-400 mb-6">
          {errorInfo.description}
        </p>

        {/* Network Status */}
        {showNetworkStatus && (
          <div className={`flex items-center justify-center gap-2 mb-4 text-sm ${
            isOnline ? 'text-green-400' : 'text-red-400'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Connected' : 'Offline'}</span>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={retrying || !isOnline}
          className="px-6 py-3 bg-[#00d4ff] text-white rounded-lg hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
        >
          {retrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </>
          )}
        </button>

        {/* Error Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              Error Details
            </summary>
            <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-800 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}


