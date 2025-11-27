import { QueryClient } from '@tanstack/react-query'

/**
 * React Query client configuration
 * Handles data fetching, caching, and synchronization
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cached data is kept for 10 minutes after last use
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests once
      retry: 1,
      
      // Don't refetch on window focus (better for mobile)
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect (we'll handle manually)
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})

