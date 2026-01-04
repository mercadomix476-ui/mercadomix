import { useState, useEffect, useCallback } from 'react';
import offlinePDVService from '@/services/offlinePDVService';
import { toast } from 'sonner';

/**
 * Hook para gerenciar sincronização de produtos entre Supabase e cache offline
 */
export function useProductSync() {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    productCount: 0,
    error: null,
    needsSync: false
  });

  // Verificar se precisa sincronizar
  const checkSyncNeeded = useCallback(async () => {
    try {
      const stats = await offlinePDVService.getCacheStats();
      const needsSync = await offlinePDVService.shouldUpdateCache();
      
      setSyncStatus(prev => ({
        ...prev,
        productCount: stats.productCount,
        lastSync: stats.lastFullSync ? new Date(stats.lastFullSync) : null,
        needsSync,
        error: null
      }));
      
      return needsSync;
    } catch (error) {
      console.error('Erro ao verificar status de sync:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: error.message
      }));
      return true; // Assume que precisa sincronizar em caso de erro
    }
  }, []);

  // Sincronizar produtos
  const syncProducts = useCallback(async (options = {}) => {
    const { 
      showToast = true, 
      silent = false,
      onProgress 
    } = options;

    if (!navigator.onLine) {
      const message = 'Sem conexão com a internet';
      if (showToast) toast.error(message);
      return { success: false, message };
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      if (showToast && !silent) {
        toast.info('Sincronizando produtos...', {
          description: 'Buscando dados do servidor',
          duration: 2000
        });
      }

      // Simular progresso se callback fornecido
      let progressInterval;
      if (onProgress) {
        let progress = 0;
        progressInterval = setInterval(() => {
          progress = Math.min(progress + 10, 90);
          onProgress(progress);
        }, 200);
      }

      const result = await offlinePDVService.refreshProductCache();

      if (progressInterval) {
        clearInterval(progressInterval);
        onProgress(100);
      }

      if (result.success) {
        const newLastSync = new Date();
        setSyncStatus(prev => ({
          ...prev,
          lastSync: newLastSync,
          productCount: result.productCount || prev.productCount,
          needsSync: false,
          error: null
        }));

        if (showToast && !silent) {
          toast.success('Produtos sincronizados!', {
            description: result.message,
            duration: 4000
          });
        }

        return { 
          success: true, 
          message: result.message,
          productCount: result.productCount,
          timestamp: newLastSync
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: error.message
      }));

      if (showToast && !silent) {
        toast.error('Erro na sincronização', {
          description: error.message,
          duration: 5000
        });
      }

      return { success: false, message: error.message };
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  // Sincronização automática
  const autoSync = useCallback(async () => {
    if (!navigator.onLine) return;
    
    const needsSync = await checkSyncNeeded();
    if (needsSync) {
      await syncProducts({ showToast: false, silent: true });
    }
  }, [checkSyncNeeded, syncProducts]);

  // Limpar cache
  const clearCache = useCallback(async (options = {}) => {
    const { showToast = true } = options;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await offlinePDVService.rebuildCache();
      
      setSyncStatus(prev => ({
        ...prev,
        productCount: 0,
        lastSync: null,
        needsSync: true,
        error: null
      }));

      if (showToast) {
        toast.success('Cache limpo com sucesso!', {
          description: 'Todos os produtos foram removidos',
          duration: 3000
        });
      }

      return { success: true, message: 'Cache limpo com sucesso' };
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      setSyncStatus(prev => ({
        ...prev,
        error: error.message
      }));

      if (showToast) {
        toast.error('Erro ao limpar cache', {
          description: error.message,
          duration: 5000
        });
      }

      return { success: false, message: error.message };
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      
      // Auto-sincronizar quando voltar online
      setTimeout(() => {
        autoSync();
      }, 1000);
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Verificar status inicial
  useEffect(() => {
    checkSyncNeeded();
  }, [checkSyncNeeded]);

  // Verificar periodicamente se precisa sincronizar
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkSyncNeeded();
      }
    }, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [checkSyncNeeded]);

  return {
    // Status
    syncStatus,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    lastSync: syncStatus.lastSync,
    productCount: syncStatus.productCount,
    needsSync: syncStatus.needsSync,
    error: syncStatus.error,
    
    // Funções
    syncProducts,
    clearCache,
    checkSyncNeeded,
    autoSync,
    
    // Utilitários
    canSync: syncStatus.isOnline && !syncStatus.isSyncing,
    syncAge: syncStatus.lastSync ? 
      Math.floor((new Date() - syncStatus.lastSync) / (1000 * 60 * 60)) : null,
    hasCache: syncStatus.productCount > 0
  };
}

export default useProductSync;