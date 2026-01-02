import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for managing logo caching and performance optimizations
 * Implements requirements 4.5, 5.3
 * 
 * Features:
 * - In-memory logo caching with LRU eviction
 * - Progressive image loading
 * - Cache invalidation on logo changes
 * - Performance metrics tracking
 * - Preloading optimization
 */
export function useLogoCaching() {
  const queryClient = useQueryClient();
  const [cacheStats, setCacheStats] = useState({
    hitCount: 0,
    missCount: 0,
    totalRequests: 0,
    cacheSize: 0,
    lastCleared: null
  });
  
  // In-memory cache with LRU eviction
  const cacheRef = useRef(new Map());
  const accessOrderRef = useRef(new Map());
  const maxCacheSize = 50; // Maximum number of cached images
  const maxCacheAge = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Performance metrics
  const metricsRef = useRef({
    loadTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    totalBytes: 0
  });

  /**
   * Get cached image or load from URL
   * @param {string} url - Image URL to cache
   * @param {Object} options - Caching options
   * @returns {Promise<Object>} - Cached image data
   */
  const getCachedImage = useCallback(async (url, options = {}) => {
    const {
      priority = 'normal',
      preload = false,
      onProgress,
      timeout = 10000
    } = options;

    if (!url) return null;

    const startTime = performance.now();
    const cacheKey = url;

    // Check in-memory cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached && !isCacheExpired(cached)) {
      // Update access order for LRU
      accessOrderRef.current.set(cacheKey, Date.now());
      
      // Update stats
      setCacheStats(prev => ({
        ...prev,
        hitCount: prev.hitCount + 1,
        totalRequests: prev.totalRequests + 1
      }));
      
      metricsRef.current.cacheHits++;
      
      return {
        url: cached.objectUrl,
        blob: cached.blob,
        cached: true,
        loadTime: performance.now() - startTime
      };
    }

    // Cache miss - load image
    setCacheStats(prev => ({
      ...prev,
      missCount: prev.missCount + 1,
      totalRequests: prev.totalRequests + 1
    }));
    
    metricsRef.current.cacheMisses++;

    try {
      const imageData = await loadImageWithProgress(url, {
        onProgress,
        timeout,
        priority
      });

      // Store in cache
      const cacheEntry = {
        blob: imageData.blob,
        objectUrl: imageData.objectUrl,
        timestamp: Date.now(),
        size: imageData.size,
        url: url
      };

      // Ensure cache size limit
      ensureCacheSize();
      
      cacheRef.current.set(cacheKey, cacheEntry);
      accessOrderRef.current.set(cacheKey, Date.now());

      // Update cache stats
      setCacheStats(prev => ({
        ...prev,
        cacheSize: cacheRef.current.size
      }));

      // Track performance metrics
      const loadTime = performance.now() - startTime;
      metricsRef.current.loadTimes.push(loadTime);
      metricsRef.current.totalBytes += imageData.size;

      return {
        url: imageData.objectUrl,
        blob: imageData.blob,
        cached: false,
        loadTime
      };

    } catch (error) {
      console.error('Failed to load and cache image:', error);
      throw error;
    }
  }, []);

  /**
   * Load image with progress tracking and optimization
   * @private
   */
  const loadImageWithProgress = useCallback((url, options = {}) => {
    const { onProgress, timeout = 10000, priority = 'normal' } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Image load timeout'));
      }, timeout);

      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      // Set priority hint if supported
      if ('priority' in xhr) {
        xhr.priority = priority;
      }

      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        clearTimeout(timeoutId);
        
        if (xhr.status === 200) {
          const blob = xhr.response;
          const objectUrl = URL.createObjectURL(blob);
          
          resolve({
            blob,
            objectUrl,
            size: blob.size,
            type: blob.type
          });
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Network error loading image'));
      };

      xhr.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Image load aborted'));
      };

      xhr.send();
    });
  }, []);

  /**
   * Check if cache entry is expired
   * @private
   */
  const isCacheExpired = useCallback((cacheEntry) => {
    return Date.now() - cacheEntry.timestamp > maxCacheAge;
  }, [maxCacheAge]);

  /**
   * Ensure cache doesn't exceed size limit using LRU eviction
   * @private
   */
  const ensureCacheSize = useCallback(() => {
    while (cacheRef.current.size >= maxCacheSize) {
      // Find least recently used entry
      let oldestKey = null;
      let oldestTime = Date.now();

      for (const [key, accessTime] of accessOrderRef.current.entries()) {
        if (accessTime < oldestTime) {
          oldestTime = accessTime;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        // Revoke object URL to prevent memory leaks
        const entry = cacheRef.current.get(oldestKey);
        if (entry && entry.objectUrl) {
          URL.revokeObjectURL(entry.objectUrl);
        }

        cacheRef.current.delete(oldestKey);
        accessOrderRef.current.delete(oldestKey);
      } else {
        break; // Safety break
      }
    }
  }, [maxCacheSize]);

  /**
   * Preload images for better performance
   * @param {string[]} urls - Array of image URLs to preload
   * @param {Object} options - Preload options
   */
  const preloadImages = useCallback(async (urls, options = {}) => {
    const { 
      concurrent = 3,
      priority = 'low',
      onProgress 
    } = options;

    if (!Array.isArray(urls) || urls.length === 0) return;

    const results = [];
    const chunks = [];
    
    // Split URLs into chunks for concurrent loading
    for (let i = 0; i < urls.length; i += concurrent) {
      chunks.push(urls.slice(i, i + concurrent));
    }

    let completed = 0;
    const total = urls.length;

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (url) => {
        try {
          const result = await getCachedImage(url, { 
            priority,
            preload: true 
          });
          completed++;
          
          if (onProgress) {
            onProgress((completed / total) * 100);
          }
          
          return { url, success: true, result };
        } catch (error) {
          completed++;
          
          if (onProgress) {
            onProgress((completed / total) * 100);
          }
          
          return { url, success: false, error: error.message };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }, [getCachedImage]);

  /**
   * Clear cache and revoke object URLs
   */
  const clearCache = useCallback(() => {
    // Revoke all object URLs to prevent memory leaks
    for (const entry of cacheRef.current.values()) {
      if (entry.objectUrl) {
        URL.revokeObjectURL(entry.objectUrl);
      }
    }

    cacheRef.current.clear();
    accessOrderRef.current.clear();

    setCacheStats(prev => ({
      ...prev,
      cacheSize: 0,
      lastCleared: new Date().toISOString()
    }));

    // Reset metrics
    metricsRef.current = {
      loadTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalBytes: 0
    };
  }, []);

  /**
   * Invalidate specific cache entry
   */
  const invalidateCache = useCallback((url) => {
    if (!url) return;

    const entry = cacheRef.current.get(url);
    if (entry) {
      if (entry.objectUrl) {
        URL.revokeObjectURL(entry.objectUrl);
      }
      cacheRef.current.delete(url);
      accessOrderRef.current.delete(url);

      setCacheStats(prev => ({
        ...prev,
        cacheSize: cacheRef.current.size
      }));
    }

    // Also invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['logo-image', url] });
  }, [queryClient]);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    const avgLoadTime = metrics.loadTimes.length > 0 
      ? metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length 
      : 0;

    return {
      ...cacheStats,
      averageLoadTime: avgLoadTime,
      totalCacheHits: metrics.cacheHits,
      totalCacheMisses: metrics.cacheMisses,
      totalBytesLoaded: metrics.totalBytes,
      hitRate: metrics.cacheHits + metrics.cacheMisses > 0 
        ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 
        : 0
    };
  }, [cacheStats]);

  /**
   * Clean up expired cache entries
   */
  const cleanupExpiredEntries = useCallback(() => {
    let cleanedCount = 0;
    
    for (const [key, entry] of cacheRef.current.entries()) {
      if (isCacheExpired(entry)) {
        if (entry.objectUrl) {
          URL.revokeObjectURL(entry.objectUrl);
        }
        cacheRef.current.delete(key);
        accessOrderRef.current.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      setCacheStats(prev => ({
        ...prev,
        cacheSize: cacheRef.current.size
      }));
    }

    return cleanedCount;
  }, [isCacheExpired]);

  // Listen for logo update events to invalidate cache
  useEffect(() => {
    const handleLogoUpdate = (event) => {
      const { logoUrl } = event.detail || {};
      
      if (logoUrl) {
        invalidateCache(logoUrl);
      } else {
        // Clear all logo-related cache if no specific URL
        clearCache();
      }
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, [invalidateCache, clearCache]);

  // Periodic cleanup of expired entries
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [cleanupExpiredEntries]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return {
    // Core functions
    getCachedImage,
    preloadImages,
    clearCache,
    invalidateCache,
    
    // Metrics and stats
    cacheStats,
    getPerformanceMetrics,
    
    // Utilities
    cleanupExpiredEntries,
    isCacheEnabled: true,
    maxCacheSize,
    maxCacheAge
  };
}

export default useLogoCaching;