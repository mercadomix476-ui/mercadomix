import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook para gerenciar funcionalidade offline e sincronização
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada! Sincronizando dados...');
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sem conexão. Operações serão salvas localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  // Abrir/criar banco IndexedDB
  const openDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NexusCommerceDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para vendas pendentes
        if (!db.objectStoreNames.contains('pendingSales')) {
          const salesStore = db.createObjectStore('pendingSales', {
            keyPath: 'id',
            autoIncrement: true
          });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store para movimentações de estoque pendentes
        if (!db.objectStoreNames.contains('pendingStock')) {
          const stockStore = db.createObjectStore('pendingStock', {
            keyPath: 'id',
            autoIncrement: true
          });
          stockStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store para produtos (cache local)
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', {
            keyPath: 'id'
          });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('barcode', 'barcode', { unique: false });
        }

        // Store para configurações (cache local)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }, []);

  // Salvar operação offline
  const saveOfflineOperation = useCallback(async (type, data) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([`pending${type}`], 'readwrite');
      const store = transaction.objectStore(`pending${type}`);

      const operation = {
        data,
        timestamp: new Date().toISOString(),
        type,
        synced: false
      };

      await store.add(operation);
      
      setPendingOperations(prev => [...prev, operation]);
      
      // Registrar para background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(`sync-${type.toLowerCase()}`);
      }

      toast.info(`${type} salva localmente. Será sincronizada quando voltar online.`);
      
      return { success: true, offline: true };
    } catch (error) {
      console.error('Erro ao salvar operação offline:', error);
      toast.error('Erro ao salvar operação localmente');
      return { success: false, error };
    }
  }, [openDB]);

  // Sincronizar operações pendentes
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);
    
    try {
      const db = await openDB();
      
      // Sincronizar vendas
      await syncStore(db, 'pendingSales', '/api/sales');
      
      // Sincronizar estoque
      await syncStore(db, 'pendingStock', '/api/stock');
      
      toast.success('Sincronização concluída!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização. Tentando novamente...');
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, openDB]);

  // Sincronizar uma store específica
  const syncStore = async (db, storeName, apiEndpoint) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const operations = request.result;
        
        for (const operation of operations) {
          try {
            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.data)
            });

            if (response.ok) {
              // Remover da store local após sincronização bem-sucedida
              await store.delete(operation.id);
              console.log(`Operação ${operation.id} sincronizada com sucesso`);
            }
          } catch (error) {
            console.error(`Erro ao sincronizar operação ${operation.id}:`, error);
          }
        }
        
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Buscar dados do cache local
  const getFromCache = useCallback(async (storeName, key = null) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      if (key) {
        const request = store.get(key);
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        const request = store.getAll();
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Erro ao buscar do cache:', error);
      return null;
    }
  }, [openDB]);

  // Salvar no cache local
  const saveToCache = useCallback(async (storeName, data) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (Array.isArray(data)) {
        for (const item of data) {
          await store.put(item);
        }
      } else {
        await store.put(data);
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      return false;
    }
  }, [openDB]);

  return {
    isOnline,
    pendingOperations,
    syncInProgress,
    saveOfflineOperation,
    syncPendingOperations,
    getFromCache,
    saveToCache
  };
};

export default useOfflineSync;