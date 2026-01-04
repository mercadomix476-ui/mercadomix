import { useState, useEffect, useCallback } from 'react';
import offlinePDVService from '@/services/offlinePDVService';
import { toast } from 'sonner';

/**
 * Hook personalizado para gerenciar o cache de produtos offline
 * Fornece funcionalidades para inicializar, atualizar e monitorar o cache
 */
export function useOfflineProductCache() {
  const [cacheStats, setCacheStats] = useState({
    productCount: 0,
    cacheSizeMB: 0,
    lastFullSync: null,
    lastPartialSync: null,
    isOnline: navigator.onLine
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Atualizar estatísticas do cache
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await offlinePDVService.getCacheStats();
      setCacheStats(stats);
      setError(null);
    } catch (err) {
      console.error('Error updating cache stats:', err);
      setError(err.message);
    }
  }, []);

  // Inicializar o cache
  const initializeCache = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await offlinePDVService.init();
      await updateCacheStats();
      
      // Verificar se o cache precisa ser inicializado
      const shouldUpdate = await offlinePDVService.shouldUpdateCache();
      if (shouldUpdate && navigator.onLine) {
        await refreshCache();
      }
    } catch (err) {
      console.error('Error initializing cache:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateCacheStats]);

  // Atualizar o cache manualmente
  const refreshCache = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error('Sem conexão com a internet');
      return { success: false, message: 'Sem conexão com a internet' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await offlinePDVService.refreshProductCache();
      
      if (result.success) {
        await updateCacheStats();
        toast.success(result.message, {
          description: `${result.productCount} produtos atualizados`,
          duration: 3000
        });
      } else {
        toast.error(result.message);
      }
      
      return result;
    } catch (err) {
      console.error('Error refreshing cache:', err);
      const errorMessage = 'Erro ao atualizar cache: ' + err.message;
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [updateCacheStats]);

  // Buscar produtos no cache
  const searchOffline = useCallback(async (query, options = {}) => {
    try {
      const results = await offlinePDVService.searchProductsOffline(query, options);
      return { success: true, data: results };
    } catch (err) {
      console.error('Error searching offline:', err);
      return { success: false, error: err.message, data: [] };
    }
  }, []);

  // Verificar se o cache precisa de atualização
  const checkCacheStatus = useCallback(async () => {
    try {
      const needsUpdate = await offlinePDVService.shouldUpdateCache();
      return { needsUpdate, stats: cacheStats };
    } catch (err) {
      console.error('Error checking cache status:', err);
      return { needsUpdate: true, error: err.message };
    }
  }, [cacheStats]);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setCacheStats(prev => ({ ...prev, isOnline: true }));
      toast.success('Conexão restaurada!', {
        description: 'Cache será sincronizado automaticamente',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setCacheStats(prev => ({ ...prev, isOnline: false }));
      toast.warning('Modo offline ativado', {
        description: 'Usando dados em cache local',
        duration: 3000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializar o cache quando o hook for montado
  useEffect(() => {
    initializeCache();
  }, [initializeCache]);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  return {
    // Estados
    cacheStats,
    isLoading,
    error,
    
    // Funções
    refreshCache,
    searchOffline,
    checkCacheStatus,
    updateCacheStats,
    
    // Utilitários
    isOnline: cacheStats.isOnline,
    hasCache: cacheStats.productCount > 0,
    cacheAge: cacheStats.lastFullSync ? 
      Math.floor((new Date() - new Date(cacheStats.lastFullSync)) / (1000 * 60 * 60)) : null
  };
}

export default useOfflineProductCache;