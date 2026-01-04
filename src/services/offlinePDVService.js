/**
 * Serviço para funcionalidade offline do PDV
 */

class OfflinePDVService {
  constructor() {
    this.dbName = 'NexusCommerceDB';
    this.version = 2; // Incremented for new search indexes
    this.db = null;
    this.lastSyncTimestamp = null;
    this.syncInterval = null; // For periodic sync
    this.retryTimeout = null; // For retry mechanism
    this.searchResultCache = new Map(); // Cache for search results
    this.performanceMetrics = {
      searchTimes: [],
      cacheTimes: [],
      syncTimes: []
    };
  }

  // Inicializar banco de dados
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        this.db = request.result;
        
        // Initialize cache if it's empty and we're online
        try {
          await this.initializeCacheIfNeeded();
        } catch (error) {
          console.warn('Failed to initialize cache during init:', error);
        }
        
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para produtos (cache local) with enhanced search indexes
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('name', 'name', { unique: false });
          productsStore.createIndex('name_normalized', 'name_normalized', { unique: false });
          productsStore.createIndex('barcode', 'barcode', { unique: false });
          productsStore.createIndex('sku', 'sku', { unique: false });
          productsStore.createIndex('category', 'category', { unique: false });
          productsStore.createIndex('last_updated', 'last_updated', { unique: false });
        } else if (event.oldVersion < 2) {
          // Upgrade existing products store with new indexes
          const transaction = event.target.transaction;
          const productsStore = transaction.objectStore('products');
          
          if (!productsStore.indexNames.contains('name_normalized')) {
            productsStore.createIndex('name_normalized', 'name_normalized', { unique: false });
          }
          if (!productsStore.indexNames.contains('sku')) {
            productsStore.createIndex('sku', 'sku', { unique: false });
          }
          if (!productsStore.indexNames.contains('category')) {
            productsStore.createIndex('category', 'category', { unique: false });
          }
          if (!productsStore.indexNames.contains('last_updated')) {
            productsStore.createIndex('last_updated', 'last_updated', { unique: false });
          }
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

        // Store para configurações e metadata
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Initialize cache if it's empty and we're online
  async initializeCacheIfNeeded() {
    try {
      const productCount = await this.getCacheProductCount();
      const metadata = await this.getCacheMetadata();
      
      // Check if cache is empty or very old (more than 7 days)
      const lastSync = metadata.last_full_sync ? new Date(metadata.last_full_sync) : null;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const needsInitialization = productCount === 0 || !lastSync || lastSync < sevenDaysAgo;
      
      if (needsInitialization && this.isOnline()) {
        console.log('Initializing product cache...');
        await this.cacheAllProducts();
        console.log('Product cache initialized successfully');
      }
    } catch (error) {
      console.warn('Cache initialization failed:', error);
    }
  }

  // Salvar produtos no cache local
  async cacheProducts(products) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    for (const product of products) {
      // Enhance product with normalized name for better search
      const enhancedProduct = {
        ...product,
        name_normalized: this.normalizeString(product.name || ''),
        last_updated: new Date().toISOString(),
        search_keywords: this.generateSearchKeywords(product)
      };
      store.put(enhancedProduct);
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Update cache metadata after successful caching
    try {
      const totalProducts = await this.getCacheProductCount();
      const cacheSize = await this.calculateCacheSize();
      const currentMetadata = await this.getCacheMetadata();
      
      await this.updateCacheMetadata({
        ...currentMetadata,
        total_products: totalProducts,
        cache_size_mb: cacheSize,
        last_partial_sync: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to update cache metadata:', error);
    }

    return true;
  }

  // Normalize string for fuzzy search (remove accents, lowercase)
  normalizeString(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .trim();
  }

  // Generate additional search keywords for a product
  generateSearchKeywords(product) {
    const keywords = [];
    if (product.name) keywords.push(this.normalizeString(product.name));
    if (product.sku) keywords.push(product.sku.toLowerCase());
    if (product.barcode) keywords.push(product.barcode.toLowerCase());
    if (product.category) keywords.push(this.normalizeString(product.category));
    return keywords;
  }

  // Get recent products from cache when no search query is provided
  async getRecentProductsFromCache(limit = 10) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        const allProducts = request.result;
        // Sort by name and limit results
        const sortedProducts = allProducts
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, limit);
        resolve(sortedProducts);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Enhanced search with result caching for repeated queries
  async searchProducts(query, options = {}) {
    const startTime = performance.now();
    
    if (!this.db) await this.init();

    const {
      limit = 10,
      exactMatch = false,
      searchFields = ['name', 'barcode', 'sku'],
      sortBy = 'relevance',
      useCache = true
    } = options;

    if (!query || query.trim() === '') {
      // If no search query, return recent products from cache
      return this.getRecentProductsFromCache(limit);
    }

    // Check search result cache for repeated queries (Performance optimization)
    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    if (useCache && this.searchResultCache && this.searchResultCache.has(cacheKey)) {
      const cachedResult = this.searchResultCache.get(cacheKey);
      const cacheAge = Date.now() - cachedResult.timestamp;
      
      // Use cached results if less than 30 seconds old
      if (cacheAge < 30000) {
        console.log(`Using cached search results for "${query}" (${cacheAge}ms old)`);
        return cachedResult.results;
      } else {
        // Remove expired cache entry
        this.searchResultCache.delete(cacheKey);
      }
    }

    const results = await this.performSearch(query, { exactMatch, searchFields, limit });
    const rankedResults = this.rankSearchResults(results, query, sortBy);
    const limitedResults = rankedResults.slice(0, limit);

    // Cache search results for repeated queries
    if (useCache) {
      if (!this.searchResultCache) {
        this.searchResultCache = new Map();
      }
      
      // Limit cache size to prevent memory issues
      if (this.searchResultCache.size >= 50) {
        // Remove oldest entries
        const oldestKey = this.searchResultCache.keys().next().value;
        this.searchResultCache.delete(oldestKey);
      }
      
      this.searchResultCache.set(cacheKey, {
        results: limitedResults,
        timestamp: Date.now()
      });
    }

    const endTime = performance.now();
    console.log(`Search completed in ${endTime - startTime}ms`);

    return limitedResults;
  }

  // Optimized core search implementation with progressive loading
  async performSearch(query, options) {
    const { exactMatch, searchFields, limit } = options;
    const normalizedQuery = this.normalizeString(query);
    const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      
      // Use index-based search for better performance when possible
      if (searchFields.includes('barcode') && query.match(/^\d+$/)) {
        // Direct barcode index lookup for numeric queries
        const index = store.index('barcode');
        const request = index.get(query);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve([{ ...result, _searchScore: 1000 }]);
          } else {
            // Fallback to full search
            this.performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit)
              .then(resolve)
              .catch(reject);
          }
        };
        
        request.onerror = () => {
          // Fallback to full search on error
          this.performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit)
            .then(resolve)
            .catch(reject);
        };
      } else if (searchFields.includes('sku') && query.match(/^[A-Z0-9]+$/i)) {
        // Direct SKU index lookup for alphanumeric queries
        const index = store.index('sku');
        const request = index.get(query.toUpperCase());
        
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve([{ ...result, _searchScore: 999 }]);
          } else {
            // Fallback to full search
            this.performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit)
              .then(resolve)
              .catch(reject);
          }
        };
        
        request.onerror = () => {
          // Fallback to full search on error
          this.performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit)
            .then(resolve)
            .catch(reject);
        };
      } else {
        // Full search for name-based and complex queries
        this.performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  // Full search implementation with progressive loading for large result sets
  async performFullSearch(store, query, normalizedQuery, searchTerms, searchFields, exactMatch, limit) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allProducts = request.result;
        const matchingProducts = [];
        let processedCount = 0;
        
        // Progressive processing for large datasets
        const batchSize = 100;
        const processBatch = (startIndex) => {
          const endIndex = Math.min(startIndex + batchSize, allProducts.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const product = allProducts[i];
            const score = this.calculateMatchScore(product, query, normalizedQuery, searchTerms, searchFields, exactMatch);
            if (score > 0) {
              matchingProducts.push({ ...product, _searchScore: score });
              
              // Early termination if we have enough high-scoring results
              if (matchingProducts.length >= limit * 3 && score < 100) {
                break;
              }
            }
          }
          
          processedCount = endIndex;
          
          // Continue processing if not done and we need more results
          if (processedCount < allProducts.length && matchingProducts.length < limit * 2) {
            // Use setTimeout to prevent blocking the main thread
            setTimeout(() => processBatch(processedCount), 0);
          } else {
            // Sort and return results
            matchingProducts.sort((a, b) => b._searchScore - a._searchScore);
            resolve(matchingProducts);
          }
        };
        
        // Start progressive processing
        processBatch(0);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Calculate match score for ranking
  calculateMatchScore(product, originalQuery, normalizedQuery, searchTerms, searchFields, exactMatch) {
    let score = 0;
    const originalQueryLower = originalQuery.toLowerCase();

    // Exact matches for barcode and SKU (highest priority)
    if (searchFields.includes('barcode') && product.barcode) {
      if (product.barcode.toLowerCase() === originalQueryLower) {
        return 1000; // Highest score for exact barcode match
      }
    }

    if (searchFields.includes('sku') && product.sku) {
      if (product.sku.toLowerCase() === originalQueryLower) {
        return 999; // Second highest for exact SKU match
      }
    }

    // Name matching
    if (searchFields.includes('name') && product.name) {
      const productNameNormalized = this.normalizeString(product.name);
      
      if (exactMatch) {
        if (productNameNormalized === normalizedQuery) {
          score += 500;
        }
      } else {
        // Fuzzy matching for names
        if (productNameNormalized.includes(normalizedQuery)) {
          score += 300;
        }

        // Multi-term search (OR logic)
        const matchedTerms = searchTerms.filter(term => 
          productNameNormalized.includes(term)
        );
        
        if (matchedTerms.length > 0) {
          score += matchedTerms.length * 50; // Bonus for each matched term
        }

        // Bonus for matches at the beginning of the name
        if (productNameNormalized.startsWith(normalizedQuery)) {
          score += 100;
        }
      }
    }

    // Partial matches for barcode and SKU
    if (!exactMatch) {
      if (searchFields.includes('barcode') && product.barcode && 
          product.barcode.toLowerCase().includes(originalQueryLower)) {
        score += 200;
      }

      if (searchFields.includes('sku') && product.sku && 
          product.sku.toLowerCase().includes(originalQueryLower)) {
        score += 200;
      }
    }

    return score;
  }

  // Rank and sort search results
  rankSearchResults(results, query, sortBy) {
    if (sortBy === 'relevance') {
      return results.sort((a, b) => b._searchScore - a._searchScore);
    } else if (sortBy === 'name') {
      return results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
      return results.sort((a, b) => (a.sale_price || 0) - (b.sale_price || 0));
    }
    
    return results;
  }

  // Search products offline (explicit offline method)
  async searchProductsOffline(query, options = {}) {
    // This method explicitly searches only from cache
    return this.searchProducts(query, options);
  }

  // Multi-term search with OR logic
  async searchProductsMultiTerm(terms, options = {}) {
    if (!Array.isArray(terms) || terms.length === 0) {
      return [];
    }

    const allResults = new Map();

    for (const term of terms) {
      const results = await this.searchProducts(term, { ...options, limit: 50 });
      for (const product of results) {
        const existing = allResults.get(product.id);
        if (!existing || product._searchScore > existing._searchScore) {
          allResults.set(product.id, product);
        }
      }
    }

    const combinedResults = Array.from(allResults.values());
    const rankedResults = this.rankSearchResults(combinedResults, terms.join(' '), options.sortBy || 'relevance');
    
    return rankedResults.slice(0, options.limit || 10);
  }

  // Buscar produtos do cache local
  async getProductsFromCache(searchTerm = '') {
    if (!this.db) await this.init();

    if (searchTerm) {
      // Use the enhanced search for better results
      return this.searchProducts(searchTerm);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache management methods
  async getLastSyncTimestamp() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('last_sync_timestamp');

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async setLastSyncTimestamp(timestamp) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'last_sync_timestamp', value: timestamp });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCacheMetadata() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('cache_metadata');

      request.onsuccess = () => {
        resolve(request.result?.value || {
          last_full_sync: null,
          last_partial_sync: null,
          total_products: 0,
          cache_size_mb: 0,
          version: '2.0'
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateCacheMetadata(metadata) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'cache_metadata', value: metadata });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Calculate cache size in MB
  async calculateCacheSize() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        const products = request.result;
        const sizeInBytes = JSON.stringify(products).length;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        resolve(sizeInMB);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get total product count in cache
  async getCacheProductCount() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Validate cache integrity
  async validateCacheIntegrity() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        const products = request.result;
        const issues = [];

        for (const product of products) {
          // Check required fields
          if (!product.id) issues.push(`Product missing id: ${JSON.stringify(product)}`);
          if (!product.name) issues.push(`Product ${product.id} missing name`);
          if (!product.name_normalized) issues.push(`Product ${product.id} missing name_normalized`);
          if (!product.last_updated) issues.push(`Product ${product.id} missing last_updated`);
          if (!Array.isArray(product.search_keywords)) issues.push(`Product ${product.id} missing or invalid search_keywords`);
          
          // Validate data types
          if (typeof product.sale_price !== 'number' && product.sale_price !== null && product.sale_price !== undefined) {
            issues.push(`Product ${product.id} has invalid sale_price type`);
          }
          if (typeof product.stock_quantity !== 'number' && product.stock_quantity !== null && product.stock_quantity !== undefined) {
            issues.push(`Product ${product.id} has invalid stock_quantity type`);
          }
        }

        resolve({
          isValid: issues.length === 0,
          issues,
          totalProducts: products.length
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Enhanced cache cleanup with fine-tuned thresholds
  async clearExpiredCache(maxSizeMB = 50) {
    if (!this.db) await this.init();

    const currentSize = await this.calculateCacheSize();
    
    if (currentSize <= maxSizeMB) {
      return { cleared: 0, currentSize };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const index = store.index('last_updated');
      const request = index.openCursor();

      const productsToDelete = [];
      let totalSize = currentSize;
      const targetSize = maxSizeMB * 0.8; // Clean up to 80% of max size for better performance

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && totalSize > targetSize) {
          const product = cursor.value;
          const productSize = JSON.stringify(product).length / (1024 * 1024);
          
          // Enhanced cleanup criteria
          const lastUpdated = new Date(product.last_updated);
          const ageInHours = (new Date() - lastUpdated) / (1000 * 60 * 60);
          
          // Remove products older than 7 days or if we're over the size limit
          if (ageInHours > 168 || totalSize > maxSizeMB) {
            productsToDelete.push(product.id);
            totalSize -= productSize;
          }
          
          cursor.continue();
        } else {
          // Delete the selected products
          const deletePromises = productsToDelete.map(id => {
            return new Promise((resolveDelete, rejectDelete) => {
              const deleteRequest = store.delete(id);
              deleteRequest.onsuccess = () => resolveDelete();
              deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
            });
          });

          Promise.all(deletePromises)
            .then(() => {
              // Update cache metadata after cleanup
              this.updateCacheMetadata({
                last_cleanup: new Date().toISOString(),
                cleanup_removed: productsToDelete.length,
                cache_size_after_cleanup: totalSize
              }).catch(error => {
                console.warn('Failed to update cleanup metadata:', error);
              });
              
              resolve({
                cleared: productsToDelete.length,
                currentSize: totalSize,
                targetSize,
                cleanupCriteria: {
                  maxAge: '7 days',
                  targetSizePercent: 80
                }
              });
            })
            .catch(reject);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Rebuild cache from scratch (corruption recovery)
  async rebuildCache() {
    if (!this.db) await this.init();

    // Clear all products
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = async () => {
        try {
          // Reset cache metadata
          await this.updateCacheMetadata({
            last_full_sync: null,
            last_partial_sync: null,
            total_products: 0,
            cache_size_mb: 0,
            version: '2.0'
          });
          
          resolve({ success: true, message: 'Cache cleared and ready for rebuild' });
        } catch (error) {
          reject(error);
        }
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Enhanced cache population with metadata tracking
  async cacheAllProducts() {
    try {
      console.log('Caching all products for offline mode...');
      
      // Import supabaseService to fetch products
      const { api: supabaseService } = await import('../api/supabaseService.js');
      
      // Fetch all products from Supabase in batches to avoid memory issues
      let allProducts = [];
      let page = 1;
      const itemsPerPage = 100; // Fetch in batches of 100
      let hasMore = true;
      
      while (hasMore) {
        try {
          const { data: products, count } = await supabaseService.entities.Product.list({
            page,
            itemsPerPage,
            filters: {},
            search: ''
          });
          
          if (products && products.length > 0) {
            allProducts = allProducts.concat(products);
            page++;
            
            // Check if we have more products to fetch
            hasMore = allProducts.length < count;
          } else {
            hasMore = false;
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch products page ${page}:`, fetchError);
          hasMore = false;
        }
      }
      
      if (allProducts.length > 0) {
        // Cache all fetched products
        await this.cacheProducts(allProducts);
        console.log(`All products cached for offline mode (${allProducts.length} products)`);
      } else {
        console.warn('No products found to cache');
      }
      
      // Update metadata to reflect the caching operation
      const currentMetadata = await this.getCacheMetadata();
      const newMetadata = {
        ...currentMetadata,
        last_full_sync: new Date().toISOString(),
        last_partial_sync: new Date().toISOString(),
        total_products: allProducts.length
      };
      
      await this.updateCacheMetadata(newMetadata);
      
      console.log('cacheAllProducts completed - metadata updated');
      return { success: true, productCount: allProducts.length, timestamp: newMetadata.last_full_sync };
    } catch (error) {
      console.error('Error in cacheAllProducts:', error);
      throw error;
    }
  }

  // Automatic cache synchronization methods
  
  // Periodic cache update mechanism (30-minute intervals)
  startPeriodicSync() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Set up 30-minute periodic sync
    this.syncInterval = setInterval(async () => {
      if (this.isOnline()) {
        try {
          await this.syncProductCache();
          console.log('Periodic cache sync completed');
        } catch (error) {
          console.error('Periodic cache sync failed:', error);
          // Retry mechanism will handle this
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('Periodic cache synchronization started (30-minute intervals)');
  }

  // Stop periodic synchronization
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic cache synchronization stopped');
    }
  }

  // Sync product cache with retry mechanism
  async syncProductCache() {
    if (!this.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    try {
      console.log('Starting product cache synchronization...');
      
      // Get the last sync timestamp to fetch only updated products
      const lastSync = await this.getLastSyncTimestamp();
      const { api: supabaseService } = await import('../api/supabaseService.js');
      
      // For incremental sync, we could add a filter for updated_at > lastSync
      // For now, we'll do a full sync to ensure data consistency
      let allProducts = [];
      let page = 1;
      const itemsPerPage = 100;
      let hasMore = true;
      
      while (hasMore) {
        try {
          const { data: products, count } = await supabaseService.entities.Product.list({
            page,
            itemsPerPage,
            filters: {},
            search: ''
          });
          
          if (products && products.length > 0) {
            allProducts = allProducts.concat(products);
            page++;
            hasMore = allProducts.length < count;
          } else {
            hasMore = false;
          }
        } catch (fetchError) {
          console.warn(`Failed to fetch products page ${page} during sync:`, fetchError);
          hasMore = false;
        }
      }
      
      if (allProducts.length > 0) {
        // Update cache with latest products
        await this.cacheProducts(allProducts);
        console.log(`Cache synchronized with ${allProducts.length} products`);
      }
      
      const syncTimestamp = new Date().toISOString();
      
      // Update last sync timestamp
      await this.setLastSyncTimestamp(syncTimestamp);
      
      // Update cache metadata
      const currentMetadata = await this.getCacheMetadata();
      const updatedMetadata = {
        ...currentMetadata,
        last_partial_sync: syncTimestamp,
        total_products: allProducts.length
      };
      
      await this.updateCacheMetadata(updatedMetadata);
      
      console.log('Cache sync completed at:', syncTimestamp);
      return { success: true, timestamp: syncTimestamp, productCount: allProducts.length };
    } catch (error) {
      console.error('Cache sync failed:', error);
      
      // Start retry mechanism
      this.scheduleRetrySync();
      throw error;
    }
  }

  // Immediate cache update for product modifications
  async updateProductCache(products) {
    if (!Array.isArray(products)) {
      products = [products];
    }

    try {
      // Update products in cache immediately
      await this.cacheProducts(products);
      
      // Update metadata to reflect immediate update
      const currentMetadata = await this.getCacheMetadata();
      const updatedMetadata = {
        ...currentMetadata,
        last_partial_sync: new Date().toISOString()
      };
      
      await this.updateCacheMetadata(updatedMetadata);
      
      console.log(`Immediately updated ${products.length} products in cache`);
      return { success: true, updatedCount: products.length };
    } catch (error) {
      console.error('Immediate cache update failed:', error);
      throw error;
    }
  }

  // Startup cache validation and refresh logic
  async validateAndRefreshCacheOnStartup() {
    try {
      if (!this.isOnline()) {
        console.log('Offline - skipping startup cache validation');
        return { skipped: true, reason: 'offline' };
      }

      const metadata = await this.getCacheMetadata();
      const lastSync = metadata.last_full_sync;
      
      if (!lastSync) {
        console.log('No previous sync found - performing full cache refresh');
        await this.cacheAllProducts();
        return { action: 'full_refresh', reason: 'no_previous_sync' };
      }

      const lastSyncTime = new Date(lastSync);
      const now = new Date();
      const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);

      if (hoursSinceLastSync > 24) {
        console.log(`Cache is ${Math.round(hoursSinceLastSync)} hours old - refreshing`);
        await this.cacheAllProducts();
        return { action: 'full_refresh', reason: 'cache_too_old', hours: hoursSinceLastSync };
      } else {
        console.log(`Cache is ${Math.round(hoursSinceLastSync)} hours old - still valid`);
        return { action: 'none', reason: 'cache_valid', hours: hoursSinceLastSync };
      }
    } catch (error) {
      console.error('Startup cache validation failed:', error);
      return { action: 'error', error: error.message };
    }
  }

  // Retry mechanism for failed synchronizations
  scheduleRetrySync() {
    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Schedule retry after 5 minutes
    this.retryTimeout = setTimeout(async () => {
      if (this.isOnline()) {
        try {
          await this.syncProductCache();
          console.log('Retry sync successful');
        } catch (error) {
          console.error('Retry sync failed, scheduling another retry:', error);
          // This will recursively schedule another retry
        }
      } else {
        console.log('Still offline - will retry sync when online');
        // Schedule another retry
        this.scheduleRetrySync();
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Sync retry scheduled for 5 minutes');
  }

  // Stop retry mechanism
  stopRetrySync() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
      console.log('Sync retry mechanism stopped');
    }
  }

  // Conflict resolution for concurrent updates
  async resolveConflicts(localProduct, remoteProduct) {
    // Simple conflict resolution: remote wins if it's newer
    const localTime = new Date(localProduct.last_updated || 0);
    const remoteTime = new Date(remoteProduct.last_updated || 0);

    if (remoteTime >= localTime) {
      console.log(`Conflict resolved: using remote version for product ${remoteProduct.id}`);
      return remoteProduct;
    } else {
      console.log(`Conflict resolved: keeping local version for product ${localProduct.id}`);
      return localProduct;
    }
  }

  // Handle online/offline transitions with automatic cache population
  setupConnectivityHandlers() {
    // Listen for online/offline events
    window.addEventListener('online', async () => {
      console.log('Connection restored - starting sync');
      try {
        await this.syncProductCache();
        this.startPeriodicSync();
      } catch (error) {
        console.error('Failed to sync after coming online:', error);
      }
    });

    window.addEventListener('offline', async () => {
      console.log('Connection lost - stopping periodic sync and populating cache');
      this.stopPeriodicSync();
      this.stopRetrySync();
      
      // Automatic cache population when going offline (Requirement 1.3)
      try {
        await this.populateCacheOnOfflineTransition();
      } catch (error) {
        console.error('Failed to populate cache on offline transition:', error);
      }
    });

    // Start periodic sync if online
    if (this.isOnline()) {
      this.startPeriodicSync();
    }
  }

  // Automatic cache population when transitioning to offline mode
  async populateCacheOnOfflineTransition() {
    console.log('Populating cache for offline mode...');
    
    try {
      // Validate current cache before offline operations
      const cacheValidation = await this.validateCacheBeforeOffline();
      
      if (!cacheValidation.isValid || cacheValidation.needsUpdate) {
        console.log('Cache needs update before offline mode');
        
        // Attempt to fetch and cache all products while we still might have connectivity
        // This is a best-effort attempt as the offline event might have already fired
        await this.cacheAllProductsForOffline();
      } else {
        console.log('Cache is valid for offline operations');
      }
      
      // Update cache metadata to reflect offline preparation
      const currentMetadata = await this.getCacheMetadata();
      await this.updateCacheMetadata({
        ...currentMetadata,
        offline_prepared_at: new Date().toISOString(),
        offline_mode: true
      });
      
      return { success: true, message: 'Cache populated for offline mode' };
    } catch (error) {
      console.error('Error populating cache on offline transition:', error);
      return { success: false, error: error.message };
    }
  }

  // Background cache preloading for better performance
  async preloadCacheInBackground() {
    if (!this.isOnline()) {
      console.log('Cannot preload cache while offline');
      return { success: false, reason: 'offline' };
    }

    try {
      console.log('Starting background cache preloading...');
      
      // Check if preloading is needed
      const metadata = await this.getCacheMetadata();
      const lastPreload = metadata.last_preload;
      
      if (lastPreload) {
        const lastPreloadTime = new Date(lastPreload);
        const now = new Date();
        const hoursSincePreload = (now - lastPreloadTime) / (1000 * 60 * 60);
        
        if (hoursSincePreload < 6) { // Preload every 6 hours
          console.log(`Cache preloaded ${Math.round(hoursSincePreload)} hours ago - skipping`);
          return { success: true, skipped: true, reason: 'recent_preload' };
        }
      }
      
      // Perform background preloading
      await this.cacheAllProductsForOffline();
      
      // Update preload timestamp
      const updatedMetadata = await this.getCacheMetadata();
      await this.updateCacheMetadata({
        ...updatedMetadata,
        last_preload: new Date().toISOString()
      });
      
      console.log('Background cache preloading completed');
      return { success: true, message: 'Background preloading completed' };
    } catch (error) {
      console.error('Background cache preloading failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Cache validation before offline operations
  async validateCacheBeforeOffline() {
    try {
      const metadata = await this.getCacheMetadata();
      const productCount = await this.getCacheProductCount();
      const cacheSize = await this.calculateCacheSize();
      
      // Check if cache is empty or very small
      if (productCount === 0) {
        return {
          isValid: false,
          needsUpdate: true,
          reason: 'empty_cache',
          productCount,
          cacheSize
        };
      }
      
      // Check if cache is too old
      const lastSync = metadata.last_full_sync || metadata.last_partial_sync;
      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        const now = new Date();
        const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);
        
        if (hoursSinceSync > 24) {
          return {
            isValid: false,
            needsUpdate: true,
            reason: 'cache_too_old',
            hoursSinceSync: Math.round(hoursSinceSync),
            productCount,
            cacheSize
          };
        }
      }
      
      // Check cache integrity
      const integrityCheck = await this.validateCacheIntegrity();
      if (!integrityCheck.isValid) {
        return {
          isValid: false,
          needsUpdate: true,
          reason: 'cache_corrupted',
          issues: integrityCheck.issues,
          productCount,
          cacheSize
        };
      }
      
      return {
        isValid: true,
        needsUpdate: false,
        reason: 'cache_valid',
        productCount,
        cacheSize,
        lastSync
      };
    } catch (error) {
      console.error('Cache validation failed:', error);
      return {
        isValid: false,
        needsUpdate: true,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  // Enhanced cache all products specifically for offline preparation
  async cacheAllProductsForOffline() {
    try {
      console.log('Caching all products for offline mode...');
      
      // Use the main cacheAllProducts method which now fetches real data
      const result = await this.cacheAllProducts();
      
      if (result.success) {
        // Update metadata with offline-specific flags
        const currentMetadata = await this.getCacheMetadata();
        const newMetadata = {
          ...currentMetadata,
          offline_cache_prepared: true,
          offline_preparation_timestamp: result.timestamp,
          total_products: result.productCount || currentMetadata.total_products
        };
        
        await this.updateCacheMetadata(newMetadata);
        
        console.log('All products cached for offline mode');
        return { success: true, timestamp: result.timestamp, productCount: result.productCount };
      } else {
        throw new Error('Failed to cache products');
      }
    } catch (error) {
      console.error('Error caching all products for offline:', error);
      throw error;
    }
  }

  // Initialize synchronization system
  async initializeSyncSystem() {
    try {
      // Validate and refresh cache on startup
      await this.validateAndRefreshCacheOnStartup();
      
      // Set up connectivity handlers
      this.setupConnectivityHandlers();
      
      // Start background cache preloading if online
      if (this.isOnline()) {
        // Don't await this - let it run in background
        this.preloadCacheInBackground().catch(error => {
          console.warn('Background cache preloading failed:', error);
        });
      }
      
      console.log('Synchronization system initialized');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize sync system:', error);
      return { success: false, error: error.message };
    }
  }

  // Error handling and recovery mechanisms

  // Detect cache corruption
  async detectCacheCorruption() {
    try {
      if (!this.db) await this.init();

      // Check if database exists and is accessible
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      
      return new Promise((resolve, reject) => {
        const request = store.count();
        
        request.onsuccess = async () => {
          try {
            // Perform integrity validation
            const integrityCheck = await this.validateCacheIntegrity();
            
            resolve({
              isCorrupted: !integrityCheck.isValid,
              issues: integrityCheck.issues || [],
              canRecover: true,
              totalProducts: integrityCheck.totalProducts || 0
            });
          } catch (validationError) {
            resolve({
              isCorrupted: true,
              issues: [`Validation failed: ${validationError.message}`],
              canRecover: true,
              totalProducts: 0
            });
          }
        };
        
        request.onerror = () => {
          resolve({
            isCorrupted: true,
            issues: [`Database access failed: ${request.error?.message || 'Unknown error'}`],
            canRecover: true,
            totalProducts: 0
          });
        };
      });
    } catch (error) {
      console.error('Cache corruption detection failed:', error);
      return {
        isCorrupted: true,
        issues: [`Detection failed: ${error.message}`],
        canRecover: false,
        totalProducts: 0
      };
    }
  }

  // Automatic cache clearing and rebuilding
  async clearAndRebuildCache() {
    try {
      console.log('Starting cache clear and rebuild process...');
      
      // Step 1: Clear corrupted cache
      const clearResult = await this.rebuildCache();
      if (!clearResult.success) {
        throw new Error(`Cache clear failed: ${clearResult.message}`);
      }
      
      // Step 2: Reinitialize database if needed
      if (!this.db) {
        await this.init();
      }
      
      // Step 3: Rebuild cache from server if online
      if (this.isOnline()) {
        try {
          await this.cacheAllProductsForOffline();
          console.log('Cache rebuilt successfully from server');
          
          return {
            success: true,
            action: 'rebuilt_from_server',
            message: 'Cache cleared and rebuilt from server data'
          };
        } catch (rebuildError) {
          console.warn('Failed to rebuild from server:', rebuildError);
          
          return {
            success: true,
            action: 'cleared_only',
            message: 'Cache cleared but could not rebuild from server',
            warning: rebuildError.message
          };
        }
      } else {
        return {
          success: true,
          action: 'cleared_offline',
          message: 'Cache cleared. Will rebuild when connection is restored.',
          requiresOnlineRebuild: true
        };
      }
    } catch (error) {
      console.error('Cache clear and rebuild failed:', error);
      return {
        success: false,
        error: error.message,
        action: 'failed'
      };
    }
  }

  // Graceful handling for missing cache data
  async handleMissingCacheData(searchQuery = '') {
    try {
      console.log('Handling missing cache data scenario...');
      
      // Check if we're online and can fetch data
      if (this.isOnline()) {
        try {
          // Attempt to populate cache immediately
          await this.cacheAllProductsForOffline();
          
          // Retry the search if a query was provided
          if (searchQuery) {
            const results = await this.searchProductsOffline(searchQuery);
            return {
              success: true,
              action: 'cache_populated_and_searched',
              results,
              message: 'Cache was empty but has been populated from server'
            };
          }
          
          return {
            success: true,
            action: 'cache_populated',
            message: 'Cache was empty but has been populated from server'
          };
        } catch (populateError) {
          console.warn('Failed to populate cache:', populateError);
          
          return {
            success: false,
            action: 'populate_failed',
            error: populateError.message,
            fallback: 'online_search_recommended',
            message: 'Cache is empty and could not be populated. Try searching online.'
          };
        }
      } else {
        // Offline with no cache - provide helpful guidance
        return {
          success: false,
          action: 'offline_no_cache',
          error: 'No cached data available and system is offline',
          message: 'Connect to the internet to download product data for offline use.',
          userGuidance: {
            title: 'No Products Available Offline',
            description: 'To use the PDV offline, you need to connect to the internet first to download product data.',
            actions: ['Check internet connection', 'Retry when online', 'Contact support if problem persists']
          }
        };
      }
    } catch (error) {
      console.error('Error handling missing cache data:', error);
      return {
        success: false,
        action: 'error',
        error: error.message,
        message: 'An unexpected error occurred while handling missing cache data.'
      };
    }
  }

  // Fallback strategies for cache failures
  async implementCacheFailureFallback(operation, ...args) {
    const fallbackStrategies = [
      'retry_with_delay',
      'reinitialize_database',
      'clear_and_rebuild',
      'offline_mode_only'
    ];

    for (let i = 0; i < fallbackStrategies.length; i++) {
      const strategy = fallbackStrategies[i];
      
      try {
        console.log(`Attempting fallback strategy: ${strategy}`);
        
        switch (strategy) {
          case 'retry_with_delay':
            // Simple retry after a short delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await this[operation](...args);
            
          case 'reinitialize_database':
            // Reinitialize the database connection
            this.db = null;
            await this.init();
            return await this[operation](...args);
            
          case 'clear_and_rebuild':
            // Clear and rebuild the cache
            await this.clearAndRebuildCache();
            return await this[operation](...args);
            
          case 'offline_mode_only':
            // Return empty results with appropriate messaging
            return {
              success: false,
              results: [],
              fallbackUsed: strategy,
              message: 'Cache system unavailable. Limited functionality active.',
              userMessage: 'Some features may be limited due to technical issues.'
            };
        }
      } catch (strategyError) {
        console.warn(`Fallback strategy ${strategy} failed:`, strategyError);
        
        // If this is the last strategy, return the error
        if (i === fallbackStrategies.length - 1) {
          return {
            success: false,
            error: strategyError.message,
            allStrategiesFailed: true,
            message: 'All recovery strategies failed. System may need manual intervention.'
          };
        }
        
        // Continue to next strategy
        continue;
      }
    }
  }

  // Enhanced error logging and user notifications
  async logAndNotifyError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        operation: context.operation || 'unknown',
        userAction: context.userAction || 'unknown',
        systemState: {
          isOnline: this.isOnline(),
          hasDatabase: !!this.db,
          cacheSize: context.cacheSize || 'unknown'
        },
        ...context
      }
    };

    // Log to console (in production, this would go to a logging service)
    console.error('PDV Cache Error:', errorInfo);

    // Store error in local storage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('pdv_error_log') || '[]');
      existingErrors.push(errorInfo);
      
      // Keep only last 50 errors to prevent storage bloat
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50);
      }
      
      localStorage.setItem('pdv_error_log', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }

    // Determine user notification based on error severity
    const userNotification = this.determineUserNotification(error, context);
    
    return {
      logged: true,
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userNotification,
      errorInfo
    };
  }

  // Determine appropriate user notification for errors
  determineUserNotification(error, context) {
    const errorType = this.categorizeError(error, context);
    
    switch (errorType) {
      case 'cache_corruption':
        return {
          type: 'warning',
          title: 'Dados Corrompidos',
          message: 'Os dados locais foram corrompidos e serão recarregados automaticamente.',
          action: 'auto_recovery',
          showToUser: true
        };
        
      case 'storage_quota_exceeded':
        return {
          type: 'warning',
          title: 'Armazenamento Cheio',
          message: 'O espaço de armazenamento está cheio. Dados antigos serão removidos automaticamente.',
          action: 'cleanup',
          showToUser: true
        };
        
      case 'network_error':
        return {
          type: 'info',
          title: 'Sem Conexão',
          message: 'Trabalhando offline com dados locais.',
          action: 'offline_mode',
          showToUser: true
        };
        
      case 'database_error':
        return {
          type: 'error',
          title: 'Erro Técnico',
          message: 'Ocorreu um problema técnico. Tentando recuperar automaticamente.',
          action: 'technical_recovery',
          showToUser: true
        };
        
      case 'search_error':
        return {
          type: 'warning',
          title: 'Busca Indisponível',
          message: 'A busca está temporariamente indisponível. Tente novamente.',
          action: 'retry',
          showToUser: false // Don't show for every search error
        };
        
      default:
        return {
          type: 'error',
          title: 'Erro Inesperado',
          message: 'Ocorreu um erro inesperado. O sistema tentará se recuperar automaticamente.',
          action: 'general_recovery',
          showToUser: false
        };
    }
  }

  // Categorize errors for appropriate handling
  categorizeError(error, context) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
      return 'storage_quota_exceeded';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network_error';
    }
    
    if (errorMessage.includes('corrupt') || errorMessage.includes('invalid') || 
        context.operation === 'cache_validation' && !context.isValid) {
      return 'cache_corruption';
    }
    
    if (errorMessage.includes('database') || errorMessage.includes('indexeddb') ||
        errorMessage.includes('transaction')) {
      return 'database_error';
    }
    
    if (context.operation === 'search' || context.operation === 'searchProducts') {
      return 'search_error';
    }
    
    return 'unknown_error';
  }

  // Enhanced search with error recovery
  async searchProductsWithRecovery(query, options = {}) {
    try {
      return await this.searchProducts(query, options);
    } catch (error) {
      console.warn('Search failed, attempting recovery:', error);
      
      // Log the error
      await this.logAndNotifyError(error, {
        operation: 'searchProducts',
        userAction: 'product_search',
        query,
        options
      });
      
      // Attempt recovery
      const recoveryResult = await this.implementCacheFailureFallback('searchProducts', query, options);
      
      if (recoveryResult.success === false && recoveryResult.allStrategiesFailed) {
        // All recovery strategies failed - return empty results with error info
        return {
          results: [],
          error: true,
          message: 'Search temporarily unavailable. Please try again later.',
          recoveryAttempted: true,
          originalError: error.message
        };
      }
      
      return recoveryResult;
    }
  }

  // Enhanced cache operations with error recovery
  async cacheProductsWithRecovery(products) {
    try {
      return await this.cacheProducts(products);
    } catch (error) {
      console.warn('Cache operation failed, attempting recovery:', error);
      
      // Log the error
      await this.logAndNotifyError(error, {
        operation: 'cacheProducts',
        userAction: 'cache_update',
        productCount: products.length
      });
      
      // Check if it's a storage quota issue
      if (error.message.toLowerCase().includes('quota')) {
        try {
          // Attempt cleanup and retry
          await this.clearExpiredCache(25); // More aggressive cleanup
          return await this.cacheProducts(products);
        } catch (cleanupError) {
          console.error('Cleanup and retry failed:', cleanupError);
          throw cleanupError;
        }
      }
      
      // For other errors, attempt general recovery
      const recoveryResult = await this.implementCacheFailureFallback('cacheProducts', products);
      
      if (recoveryResult.success === false) {
        throw new Error(`Cache operation failed and recovery unsuccessful: ${error.message}`);
      }
      
      return recoveryResult;
    }
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

  // Performance monitoring and optimization methods
  
  // Clear search result cache
  clearSearchResultCache() {
    if (this.searchResultCache) {
      this.searchResultCache.clear();
      console.log('Search result cache cleared');
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const metrics = { ...this.performanceMetrics };
    
    // Calculate averages
    if (metrics.searchTimes.length > 0) {
      metrics.averageSearchTime = metrics.searchTimes.reduce((a, b) => a + b, 0) / metrics.searchTimes.length;
    }
    
    if (metrics.cacheTimes.length > 0) {
      metrics.averageCacheTime = metrics.cacheTimes.reduce((a, b) => a + b, 0) / metrics.cacheTimes.length;
    }
    
    if (metrics.syncTimes.length > 0) {
      metrics.averageSyncTime = metrics.syncTimes.reduce((a, b) => a + b, 0) / metrics.syncTimes.length;
    }
    
    return metrics;
  }

  // Record performance metric
  recordPerformanceMetric(type, duration) {
    if (!this.performanceMetrics[type]) {
      this.performanceMetrics[type] = [];
    }
    
    this.performanceMetrics[type].push(duration);
    
    // Keep only last 100 measurements to prevent memory bloat
    if (this.performanceMetrics[type].length > 100) {
      this.performanceMetrics[type] = this.performanceMetrics[type].slice(-100);
    }
  }

  // Optimize cache performance
  async optimizeCachePerformance() {
    try {
      console.log('Starting cache performance optimization...');
      
      // Clear search result cache to free memory
      this.clearSearchResultCache();
      
      // Get current cache status
      const cacheCount = await this.getCacheProductCount();
      const cacheSize = await this.calculateCacheSize();
      
      console.log(`Current cache: ${cacheCount} products, ${cacheSize.toFixed(2)}MB`);
      
      // Perform cleanup if cache is large
      if (cacheSize > 25) { // 25MB threshold
        const cleanupResult = await this.clearExpiredCache(40); // Target 40MB max
        console.log(`Cache cleanup: removed ${cleanupResult.cleared} products`);
      }
      
      // Validate cache integrity
      const integrityResult = await this.validateCacheIntegrity();
      if (!integrityResult.isValid) {
        console.warn('Cache integrity issues detected:', integrityResult.issues);
      }
      
      return {
        success: true,
        optimizations: {
          searchCacheCleared: true,
          cacheCleanupPerformed: cacheSize > 25,
          integrityValidated: true
        },
        metrics: {
          productCount: cacheCount,
          cacheSizeMB: cacheSize,
          integrityValid: integrityResult.isValid
        }
      };
    } catch (error) {
      console.error('Cache optimization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar se está online
  isOnline() {
    return navigator.onLine;
  }

  // Integration methods for PDV system
  
  // Public method to manually refresh the product cache
  async refreshProductCache() {
    try {
      console.log('Manually refreshing product cache...');
      const result = await this.cacheAllProducts();
      
      if (result.success) {
        console.log(`Product cache refreshed successfully with ${result.productCount} products`);
        return {
          success: true,
          message: `Cache atualizado com ${result.productCount} produtos`,
          productCount: result.productCount,
          timestamp: result.timestamp
        };
      } else {
        throw new Error('Failed to refresh cache');
      }
    } catch (error) {
      console.error('Failed to refresh product cache:', error);
      return {
        success: false,
        message: 'Erro ao atualizar cache: ' + error.message,
        error: error.message
      };
    }
  }

  // Check if cache needs updating
  async shouldUpdateCache() {
    try {
      const metadata = await this.getCacheMetadata();
      const lastSync = metadata.last_full_sync ? new Date(metadata.last_full_sync) : null;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return !lastSync || lastSync < oneHourAgo;
    } catch (error) {
      console.warn('Error checking cache status:', error);
      return true; // Default to needing update if we can't check
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const metadata = await this.getCacheMetadata();
      const productCount = await this.getCacheProductCount();
      const cacheSize = await this.calculateCacheSize();
      
      return {
        productCount,
        cacheSizeMB: cacheSize,
        lastFullSync: metadata.last_full_sync,
        lastPartialSync: metadata.last_partial_sync,
        isOnline: this.isOnline()
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        productCount: 0,
        cacheSizeMB: 0,
        lastFullSync: null,
        lastPartialSync: null,
        isOnline: this.isOnline(),
        error: error.message
      };
    }
  }
  
  // Initialize complete offline system integration
  async initializeOfflineIntegration() {
    try {
      console.log('Initializing complete offline integration...');
      
      // Initialize database
      await this.init();
      
      // Initialize sync system
      const syncResult = await this.initializeSyncSystem();
      
      // Optimize cache performance
      const optimizationResult = await this.optimizeCachePerformance();
      
      // Set up periodic optimization (every 30 minutes)
      setInterval(() => {
        this.optimizeCachePerformance().catch(error => {
          console.warn('Periodic cache optimization failed:', error);
        });
      }, 30 * 60 * 1000);
      
      return {
        success: true,
        components: {
          database: true,
          syncSystem: syncResult.success,
          cacheOptimization: optimizationResult.success
        },
        message: 'Offline integration initialized successfully'
      };
    } catch (error) {
      console.error('Offline integration initialization failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to initialize offline integration'
      };
    }
  }

  // Get comprehensive system status for integration monitoring
  async getSystemStatus() {
    try {
      const [
        cacheCount,
        cacheSize,
        metadata,
        integrity,
        performanceMetrics
      ] = await Promise.all([
        this.getCacheProductCount(),
        this.calculateCacheSize(),
        this.getCacheMetadata(),
        this.validateCacheIntegrity(),
        Promise.resolve(this.getPerformanceMetrics())
      ]);

      return {
        online: this.isOnline(),
        cache: {
          productCount: cacheCount,
          sizeMB: cacheSize,
          isValid: integrity.isValid,
          issues: integrity.issues,
          lastSync: metadata.last_full_sync,
          lastPartialSync: metadata.last_partial_sync
        },
        performance: {
          averageSearchTime: performanceMetrics.averageSearchTime,
          averageCacheTime: performanceMetrics.averageCacheTime,
          searchCacheSize: this.searchResultCache ? this.searchResultCache.size : 0
        },
        sync: {
          intervalActive: !!this.syncInterval,
          retryActive: !!this.retryTimeout
        }
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        error: error.message,
        online: this.isOnline()
      };
    }
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