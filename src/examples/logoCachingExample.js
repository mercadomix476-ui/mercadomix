/**
 * Logo Caching System Usage Example
 * Demonstrates how to use the new caching and performance optimizations
 * Requirements: 4.5, 5.3
 */

import React, { useEffect, useState } from 'react';
import { useLogoCaching } from '../hooks/useLogoCaching';
import { useLogoPerformance } from '../hooks/useLogoPerformance';
import { ProgressiveLogoDisplay } from '../components/ui/ProgressiveLogoDisplay';
import { LogoDisplay } from '../components/ui/LogoDisplay';

/**
 * Example component showing logo caching integration
 */
export function LogoCachingExample() {
  const { getCachedImage, preloadImages, cacheStats, getPerformanceMetrics } = useLogoCaching();
  const { metrics, recommendations, recordLoad } = useLogoPerformance();
  const [logoUrl, setLogoUrl] = useState('https://example.com/logo.jpg');
  const [performanceData, setPerformanceData] = useState(null);

  // Example: Preload commonly used logos
  useEffect(() => {
    const commonLogos = [
      'https://example.com/logo1.jpg',
      'https://example.com/logo2.jpg',
      'https://example.com/fallback.jpg'
    ];

    preloadImages(commonLogos, {
      concurrent: 2,
      priority: 'low',
      onProgress: (progress) => {
        console.log(`Preloading progress: ${progress}%`);
      }
    });
  }, [preloadImages]);

  // Example: Manual cache management
  const handleCacheImage = async () => {
    try {
      const startTime = performance.now();
      const result = await getCachedImage(logoUrl, {
        priority: 'high',
        onProgress: (progress) => {
          console.log(`Loading progress: ${progress}%`);
        }
      });

      const loadTime = performance.now() - startTime;
      
      // Record performance metrics
      recordLoad({
        url: logoUrl,
        loadTime,
        cached: result.cached,
        bytes: result.blob?.size || 0,
        source: 'manual_cache'
      });

      console.log('Image cached:', result);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  };

  // Example: Get performance insights
  const handleGetPerformanceData = () => {
    const data = getPerformanceMetrics();
    setPerformanceData(data);
    console.log('Performance metrics:', data);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Logo Caching System Example</h2>
      
      {/* Cache Statistics */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Cache Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Hit Count: {cacheStats.hitCount}</div>
          <div>Miss Count: {cacheStats.missCount}</div>
          <div>Total Requests: {cacheStats.totalRequests}</div>
          <div>Cache Size: {cacheStats.cacheSize}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-blue-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Total Loads: {metrics.totalLoads}</div>
          <div>Average Load Time: {metrics.averageLoadTime.toFixed(0)}ms</div>
          <div>Cache Hits: {metrics.cacheHits}</div>
          <div>Errors: {metrics.errors}</div>
        </div>
        
        {recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium">Recommendations:</h4>
            <ul className="list-disc list-inside text-sm">
              {recommendations.map((rec, index) => (
                <li key={index} className={`text-${rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue'}-600`}>
                  {rec.title}: {rec.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Logo Display Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Logo Display Examples</h3>
        
        {/* Standard Logo Display with Caching */}
        <div className="flex items-center space-x-4">
          <LogoDisplay
            logoUrl={logoUrl}
            alt="Cached Logo"
            size="large"
            enableCaching={true}
            priority="normal"
            onLoad={(data) => console.log('Logo loaded:', data)}
          />
          <div>
            <p className="text-sm font-medium">Standard Logo with Caching</p>
            <p className="text-xs text-gray-600">Uses in-memory cache for faster loading</p>
          </div>
        </div>

        {/* Progressive Logo Display */}
        <div className="flex items-center space-x-4">
          <ProgressiveLogoDisplay
            logoUrl={logoUrl}
            alt="Progressive Logo"
            size="large"
            enableProgressiveLoading={true}
            priority="high"
            onProgress={(progress) => console.log('Progress:', progress)}
            onLoad={(data) => console.log('Progressive logo loaded:', data)}
          />
          <div>
            <p className="text-sm font-medium">Progressive Logo Display</p>
            <p className="text-xs text-gray-600">Shows loading states and blur-to-sharp transition</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cache Controls</h3>
        
        <div className="flex space-x-4">
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo URL"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleCacheImage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cache Image
          </button>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleGetPerformanceData}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get Performance Data
          </button>
        </div>
      </div>

      {/* Performance Data Display */}
      {performanceData && (
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Detailed Performance Data</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(performanceData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example of using logo caching in a real component
 */
export function OptimizedLogoComponent({ logoUrl, storeName }) {
  const { getCachedImage } = useLogoCaching();
  const { recordLoad } = useLogoPerformance();
  const [cachedLogoUrl, setCachedLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      if (!logoUrl) return;

      setIsLoading(true);
      const startTime = performance.now();

      try {
        const result = await getCachedImage(logoUrl, {
          priority: 'normal',
          timeout: 10000
        });

        setCachedLogoUrl(result.url);
        
        // Record performance metrics
        recordLoad({
          url: logoUrl,
          loadTime: performance.now() - startTime,
          cached: result.cached,
          bytes: result.blob?.size || 0,
          source: 'optimized_component'
        });

      } catch (error) {
        console.error('Failed to load logo:', error);
        
        // Record error
        recordLoad({
          url: logoUrl,
          loadTime: performance.now() - startTime,
          cached: false,
          error: error.message,
          source: 'optimized_component'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, [logoUrl, getCachedImage, recordLoad]);

  if (isLoading) {
    return (
      <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 bg-gray-300 rounded" />
      </div>
    );
  }

  return (
    <img
      src={cachedLogoUrl}
      alt={`${storeName} logo`}
      className="w-12 h-12 object-cover rounded-lg"
      loading="lazy"
    />
  );
}

export default LogoCachingExample;