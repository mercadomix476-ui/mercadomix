import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to handle real-time logo updates throughout the application
 * Listens for logo update events and invalidates relevant React Query caches
 */
export function useLogoUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLogoUpdate = () => {
      // Invalidate settings cache to trigger re-fetch of logo data
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      // Also invalidate any other queries that might depend on logo data
      queryClient.invalidateQueries({ queryKey: ['store-logo'] });
    };

    // Listen for logo update events
    window.addEventListener('logoUpdated', handleLogoUpdate);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, [queryClient]);
}