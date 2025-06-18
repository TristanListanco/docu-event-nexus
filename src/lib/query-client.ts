import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
      retry: (failureCount, error) => {
        // Don't retry on auth errors or client errors (4xx)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      refetchOnMount: true, // Refetch when component mounts
      refetchOnReconnect: 'always', // Refetch when network reconnects
      // Use background refetch to keep data fresh without blocking UI
      refetchInterval: false, // We'll handle this per query if needed
      // Optimize for mobile Safari
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      // Optimize network behavior for mobile
      networkMode: 'online',
    },
  },
});

// Add event listener for page visibility changes to handle mobile Safari issues
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Only invalidate if we've been away for more than 5 minutes
      const lastActive = localStorage.getItem('lastActive');
      const now = Date.now();
      
      if (!lastActive || now - parseInt(lastActive) > 5 * 60 * 1000) {
        queryClient.invalidateQueries();
      }
    } else {
      // Store when we became inactive
      localStorage.setItem('lastActive', Date.now().toString());
    }
  });
}
