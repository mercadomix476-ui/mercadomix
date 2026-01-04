import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for monitoring logo loading performance and providing optimization insights
 * Implements requirements 4.5, 5.3
 * 
 * Features:
 * - Performance metrics collection
 * - Load time tracking
 * - Cache effectiveness monitoring
 * - Network usage optimization
 * - Performance recommendations
 */
export function useLogoPerformance() {
  const [metrics, setMetrics] = useState({
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLoadTime: 0,
    totalBytes: 0,
    slowLoads: 0,
    errors: 0,
    lastUpdated: null
  });

  const [recommendations, setRecommendations] = useState([]);
  const metricsRef = useRef({
    loadTimes: [],
    bytesLoaded: [],
    errorLog: [],
    cachePerformance: {
      hits: 0,
      misses: 0,
      hitRate: 0
    }
  });

  const performanceObserverRef = useRef(null);

  /**
   * Record a logo load event
   */
  const recordLoad = useCallback((loadData) => {
    const {
      url,
      loadTime,
      bytes = 0,
      cached = false,
      error = null,
      source = 'unknown'
    } = loadData;

    const currentMetrics = metricsRef.current;
    
    // Update load times
    if (loadTime > 0) {
      currentMetrics.loadTimes.push(loadTime);
      
      // Keep only last 100 measurements for performance
      if (currentMetrics.loadTimes.length > 100) {
        currentMetrics.loadTimes.shift();
      }
    }

    // Update bytes loaded
    if (bytes > 0) {
      currentMetrics.bytesLoaded.push(bytes);
      
      if (currentMetrics.bytesLoaded.length > 100) {
        currentMetrics.bytesLoaded.shift();
      }
    }

    // Update cache performance
    if (cached) {
      currentMetrics.cachePerformance.hits++;
    } else {
      currentMetrics.cachePerformance.misses++;
    }

    const totalCacheRequests = currentMetrics.cachePerformance.hits + currentMetrics.cachePerformance.misses;
    currentMetrics.cachePerformance.hitRate = totalCacheRequests > 0 
      ? (currentMetrics.cachePerformance.hits / totalCacheRequests) * 100 
      : 0;

    // Record errors
    if (error) {
      currentMetrics.errorLog.push({
        url,
        error,
        timestamp: Date.now(),
        source
      });
      
      // Keep only last 50 errors
      if (currentMetrics.errorLog.length > 50) {
        currentMetrics.errorLog.shift();
      }
    }

    // Update state metrics
    setMetrics(prev => {
      const newTotalLoads = prev.totalLoads + 1;
      const newCacheHits = cached ? prev.cacheHits + 1 : prev.cacheHits;
      const newCacheMisses = !cached ? prev.cacheMisses + 1 : prev.cacheMisses;
      const newErrors = error ? prev.errors + 1 : prev.errors;
      const newSlowLoads = loadTime > 2000 ? prev.slowLoads + 1 : prev.slowLoads;
      
      const avgLoadTime = currentMetrics.loadTimes.length > 0
        ? currentMetrics.loadTimes.reduce((a, b) => a + b, 0) / currentMetrics.loadTimes.length
        : 0;

      const totalBytes = currentMetrics.bytesLoaded.reduce((a, b) => a + b, 0);

      return {
        totalLoads: newTotalLoads,
        cacheHits: newCacheHits,
        cacheMisses: newCacheMisses,
        averageLoadTime: avgLoadTime,
        totalBytes: totalBytes,
        slowLoads: newSlowLoads,
        errors: newErrors,
        lastUpdated: new Date().toISOString()
      };
    });

    // Generate recommendations based on new data
    generateRecommendations();
  }, []);

  /**
   * Generate performance recommendations
   */
  const generateRecommendations = useCallback(() => {
    const currentMetrics = metricsRef.current;
    const newRecommendations = [];

    // Cache hit rate recommendations
    if (currentMetrics.cachePerformance.hitRate < 70 && currentMetrics.cachePerformance.misses > 10) {
      newRecommendations.push({
        type: 'cache',
        priority: 'high',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${currentMetrics.cachePerformance.hitRate.toFixed(1)}%. Consider preloading frequently used logos.`,
        action: 'preload_logos'
      });
    }

    // Load time recommendations
    const avgLoadTime = currentMetrics.loadTimes.length > 0
      ? currentMetrics.loadTimes.reduce((a, b) => a + b, 0) / currentMetrics.loadTimes.length
      : 0;

    if (avgLoadTime > 1500) {
      newRecommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Logo Loading',
        description: `Average load time is ${avgLoadTime.toFixed(0)}ms. Consider optimizing image sizes or using a CDN.`,
        action: 'optimize_images'
      });
    }

    // File size recommendations
    const avgBytes = currentMetrics.bytesLoaded.length > 0
      ? currentMetrics.bytesLoaded.reduce((a, b) => a + b, 0) / currentMetrics.bytesLoaded.length
      : 0;

    if (avgBytes > 500000) { // 500KB
      newRecommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Large Logo Files',
        description: `Average logo size is ${(avgBytes / 1024).toFixed(0)}KB. Consider compressing images or using WebP format.`,
        action: 'compress_images'
      });
    }

    // Error rate recommendations
    const errorRate = metrics.totalLoads > 0 ? (metrics.errors / metrics.totalLoads) * 100 : 0;
    if (errorRate > 5) {
      newRecommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate',
        description: `${errorRate.toFixed(1)}% of logo loads are failing. Check network connectivity and image URLs.`,
        action: 'check_urls'
      });
    }

    // Network usage recommendations
    const totalMB = metrics.totalBytes / (1024 * 1024);
    if (totalMB > 10 && currentMetrics.cachePerformance.hitRate < 50) {
      newRecommendations.push({
        type: 'network',
        priority: 'low',
        title: 'High Network Usage',
        description: `${totalMB.toFixed(1)}MB of logos loaded with low cache efficiency. Improve caching strategy.`,
        action: 'improve_caching'
      });
    }

    setRecommendations(newRecommendations);
  }, [metrics.totalLoads, metrics.errors, metrics.totalBytes]);

  /**
   * Get detailed performance report
   */
  const getPerformanceReport = useCallback(() => {
    const currentMetrics = metricsRef.current;
    
    return {
      summary: {
        ...metrics,
        cacheHitRate: currentMetrics.cachePerformance.hitRate,
        errorRate: metrics.totalLoads > 0 ? (metrics.errors / metrics.totalLoads) * 100 : 0,
        slowLoadRate: metrics.totalLoads > 0 ? (metrics.slowLoads / metrics.totalLoads) * 100 : 0
      },
      details: {
        loadTimeDistribution: getLoadTimeDistribution(),
        fileSizeDistribution: getFileSizeDistribution(),
        recentErrors: currentMetrics.errorLog.slice(-10),
        cachePerformance: currentMetrics.cachePerformance
      },
      recommendations: recommendations
    };
  }, [metrics, recommendations]);

  /**
   * Get load time distribution for analysis
   */
  const getLoadTimeDistribution = useCallback(() => {
    const loadTimes = metricsRef.current.loadTimes;
    if (loadTimes.length === 0) return {};

    const buckets = {
      fast: 0,      // < 500ms
      medium: 0,    // 500ms - 1500ms
      slow: 0,      // 1500ms - 3000ms
      verySlow: 0   // > 3000ms
    };

    loadTimes.forEach(time => {
      if (time < 500) buckets.fast++;
      else if (time < 1500) buckets.medium++;
      else if (time < 3000) buckets.slow++;
      else buckets.verySlow++;
    });

    return buckets;
  }, []);

  /**
   * Get file size distribution for analysis
   */
  const getFileSizeDistribution = useCallback(() => {
    const bytesLoaded = metricsRef.current.bytesLoaded;
    if (bytesLoaded.length === 0) return {};

    const buckets = {
      small: 0,     // < 100KB
      medium: 0,    // 100KB - 500KB
      large: 0,     // 500KB - 1MB
      veryLarge: 0  // > 1MB
    };

    bytesLoaded.forEach(bytes => {
      if (bytes < 100000) buckets.small++;
      else if (bytes < 500000) buckets.medium++;
      else if (bytes < 1000000) buckets.large++;
      else buckets.veryLarge++;
    });

    return buckets;
  }, []);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      loadTimes: [],
      bytesLoaded: [],
      errorLog: [],
      cachePerformance: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };

    setMetrics({
      totalLoads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
      totalBytes: 0,
      slowLoads: 0,
      errors: 0,
      lastUpdated: null
    });

    setRecommendations([]);
  }, []);

  /**
   * Export metrics data
   */
  const exportMetrics = useCallback(() => {
    const report = getPerformanceReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      ...report
    };

    return JSON.stringify(exportData, null, 2);
  }, [getPerformanceReport]);

  // Set up Performance Observer for additional metrics
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            if (entry.name.includes('logo') || entry.name.includes('image')) {
              recordLoad({
                url: entry.name,
                loadTime: entry.duration,
                bytes: entry.transferSize || 0,
                cached: entry.transferSize === 0,
                source: 'performance_observer'
              });
            }
          });
        });

        observer.observe({ entryTypes: ['resource'] });
        performanceObserverRef.current = observer;
      } catch (error) {
        console.warn('Failed to set up Performance Observer:', error);
      }
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [recordLoad]);

  // Listen for logo update events
  useEffect(() => {
    const handleLogoUpdate = (event) => {
      const { action, logoUrl } = event.detail || {};
      
      // Record the logo change event
      recordLoad({
        url: logoUrl || 'unknown',
        loadTime: 0,
        bytes: 0,
        cached: false,
        source: `logo_${action || 'update'}`
      });
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, [recordLoad]);

  return {
    // Metrics
    metrics,
    recommendations,
    
    // Functions
    recordLoad,
    getPerformanceReport,
    resetMetrics,
    exportMetrics,
    
    // Utilities
    isPerformanceGood: metrics.averageLoadTime < 1000 && metrics.errors === 0,
    cacheEfficiency: metrics.totalLoads > 0 ? (metrics.cacheHits / metrics.totalLoads) * 100 : 0,
    hasRecommendations: recommendations.length > 0
  };
}

export default useLogoPerformance;