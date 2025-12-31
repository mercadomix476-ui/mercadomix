/**
 * Serviço para funcionalidade offline do PDV
 */

class OfflinePDVService {
  constructor() {
    this.dbName = 'NexusCommerceDB';
    this.version = 1;
    this.db = null;
  }

  // Inicializar banco de dados
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para produtos (cache local)
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('barcode', 'barcode', { unique: false });
          productsStore.createIndex('sku', 'sku', { unique: false });
        }

        // Store para vendas offline
        if (!db.objectStoreNames.contains('offlineSales')) {
          const salesStore = db.createObjectStore('offlineSales', {
            keyPath: 'id',
            autoIncrement: true
          });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
          salesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store para configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Salvar produtos no cache local
  async cacheProducts(products) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    for (const product of products) {
      await store.put(product);
    }

    return transaction.complete;
  }

  // Buscar produtos do cache local
  async getProductsFromCache(searchTerm = '') {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        let products = request.result;

        // Filtrar por termo de busca se fornecido
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          products = products.filter(product => 
            product.name?.toLowerCase().includes(term) ||
            product.barcode?.toLowerCase().includes(term) ||
            product.sku?.toLowerCase().includes(term)
          );
        }

        resolve(products);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Salvar venda offline
  async saveOfflineSale(saleData) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['offlineSales'], 'readwrite');
    const store = transaction.objectStore('offlineSales');

    const offlineSale = {
      ...saleData,
      timestamp: new Date().toISOString(),
      synced: false,
      offline: true
    };

    return new Promise((resolve, reject) => {
      const request = store.add(offlineSale);
      
      request.onsuccess = () => {
        console.log('Venda salva offline:', request.result);
        resolve({ id: request.result, ...offlineSale });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar vendas não sincronizadas
  async getPendingSales() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineSales'], 'readonly');
      const store = transaction.objectStore('offlineSales');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Marcar venda como sincronizada
  async markSaleAsSynced(saleId) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['offlineSales'], 'readwrite');
    const store = transaction.objectStore('offlineSales');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(saleId);
      
      getRequest.onsuccess = () => {
        const sale = getRequest.result;
        if (sale) {
          sale.synced = true;
          const putRequest = store.put(sale);
          
          putRequest.onsuccess = () => resolve(sale);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Venda não encontrada'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Salvar configurações no cache
  async cacheSettings(settings) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    for (const [key, value] of Object.entries(settings)) {
      await store.put({ key, value });
    }

    return transaction.complete;
  }

  // Buscar configurações do cache
  async getSettingsFromCache() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();

      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Verificar se está online
  isOnline() {
    return navigator.onLine;
  }

  // Sincronizar vendas pendentes
  async syncPendingSales() {
    if (!this.isOnline()) {
      throw new Error('Sem conexão com a internet');
    }

    const pendingSales = await this.getPendingSales();
    const results = [];

    for (const sale of pendingSales) {
      try {
        // Aqui você faria a chamada para sua API
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        });

        if (response.ok) {
          await this.markSaleAsSynced(sale.id);
          results.push({ success: true, sale });
        } else {
          results.push({ success: false, sale, error: 'Erro na API' });
        }
      } catch (error) {
        results.push({ success: false, sale, error: error.message });
      }
    }

    return results;
  }
}

// Instância singleton
const offlinePDVService = new OfflinePDVService();

export default offlinePDVService;