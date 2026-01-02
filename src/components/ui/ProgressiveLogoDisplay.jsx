import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLogoCaching } from "@/hooks/useLogoCaching";
import nexusLogo from "@/assets/nexuslogo.jpg";

/**
 * ProgressiveLogoDisplay Component - Enhanced logo display with progressive loading
 * Implements requirements 4.5, 5.3
 * 
 * Features:
 * - Progressive image loading with blur-to-sharp transition
 * - Caching integration for improved performance
 * - Loading states with skeleton animation
 * - Error handling with graceful fallbacks
 * - Performance optimizations
 */
export function ProgressiveLogoDisplay({
  logoUrl,
  fallbackUrl = nexusLogo,
  alt = "Logo",
  className = "",
  size = "medium",
  shape = "rounded",
  showLoadingState = true,
  enableProgressiveLoading = true,
  priority = "normal",
  onLoad,
  onError,
  onProgress,
  ...props
}) {
  const { getCachedImage, preloadImages } = useLogoCaching();
  
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    hasError: false,
    progress: 0,
    currentSrc: null,
    isFromCache: false
  });

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Size variants
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16",
    xlarge: "w-20 h-20",
    custom: ""
  };

  // Shape variants
  const shapeClasses = {
    rounded: "rounded-lg",
    circle: "rounded-full", 
    square: "rounded-none",
    custom: ""
  };

  /**
   * Load image with caching and progressive enhancement
   */
  const loadImage = useCallback(async (url) => {
    if (!url) return;

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      progress: 0
    }));

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    try {
      const imageData = await getCachedImage(url, {
        priority,
        onProgress: (progress) => {
          setLoadingState(prev => ({
            ...prev,
            progress
          }));
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        timeout: 15000 // 15 second timeout
      });

      if (imageData) {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
          currentSrc: imageData.url,
          isFromCache: imageData.cached,
          progress: 100
        }));

        if (onLoad) {
          onLoad({
            url: imageData.url,
            cached: imageData.cached,
            loadTime: imageData.loadTime
          });
        }

        // If progressive loading is enabled and not from cache, apply blur effect
        if (enableProgressiveLoading && !imageData.cached && imgRef.current) {
          applyProgressiveEffect();
        }
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
      
      // Try fallback if main image fails
      if (url !== fallbackUrl) {
        await loadImage(fallbackUrl);
      } else {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          progress: 0
        }));

        if (onError) {
          onError(error);
        }
      }
    }
  }, [getCachedImage, priority, onProgress, onLoad, onError, enableProgressiveLoading, fallbackUrl]);

  /**
   * Apply progressive loading blur effect
   */
  const applyProgressiveEffect = useCallback(() => {
    if (!imgRef.current || !enableProgressiveLoading) return;

    const img = imgRef.current;
    
    // Start with blur
    img.style.filter = 'blur(5px)';
    img.style.transition = 'filter 0.3s ease-out';
    
    // Remove blur after a short delay
    setTimeout(() => {
      if (img) {
        img.style.filter = 'blur(0px)';
      }
    }, 100);
  }, [enableProgressiveLoading]);

  /**
   * Preload related images for better performance
   */
  const preloadRelatedImages = useCallback(async () => {
    const urlsToPreload = [];
    
    if (logoUrl && logoUrl !== fallbackUrl) {
      urlsToPreload.push(logoUrl);
    }
    
    if (fallbackUrl) {
      urlsToPreload.push(fallbackUrl);
    }

    if (urlsToPreload.length > 0) {
      try {
        await preloadImages(urlsToPreload, {
          priority: 'low',
          concurrent: 2
        });
      } catch (error) {
        console.warn('Failed to preload related images:', error);
      }
    }
  }, [logoUrl, fallbackUrl, preloadImages]);

  // Load image when URL changes
  useEffect(() => {
    const targetUrl = logoUrl || fallbackUrl;
    if (targetUrl) {
      loadImage(targetUrl);
    }
  }, [logoUrl, fallbackUrl, loadImage]);

  // Preload related images on mount
  useEffect(() => {
    preloadRelatedImages();
  }, [preloadRelatedImages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Loading skeleton component
   */
  const LoadingSkeleton = () => (
    <div 
      className={cn(
        "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-pulse flex items-center justify-center overflow-hidden flex-shrink-0",
        "bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-label={`Loading ${alt}`}
    >
      {showLoadingState && (
        <div className="w-1/2 h-1/2 bg-slate-400 rounded opacity-30" />
      )}
      
      {/* Progress indicator for non-cached loads */}
      {!loadingState.isFromCache && loadingState.progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-slate-500 font-medium">
            {Math.round(loadingState.progress)}%
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Error placeholder component
   */
  const ErrorPlaceholder = () => (
    <div 
      className={cn(
        "bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-label={`Failed to load ${alt}`}
    >
      <span className="text-xs font-medium">?</span>
    </div>
  );

  // Show loading state
  if (loadingState.isLoading && showLoadingState) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (loadingState.hasError) {
    return <ErrorPlaceholder />;
  }

  // Show loaded image
  return (
    <div 
      className={cn(
        "relative overflow-hidden flex-shrink-0",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-label={alt}
    >
      {loadingState.currentSrc && (
        <img
          ref={imgRef}
          src={loadingState.currentSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading={priority === 'high' ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}
      
      {/* Cache indicator (development only) */}
      {process.env.NODE_ENV === 'development' && loadingState.isFromCache && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full opacity-75" 
             title="Loaded from cache" />
      )}
    </div>
  );
}

/**
 * Enhanced StoreLogo Component with progressive loading
 */
export function ProgressiveStoreLogo({
  logoUrl,
  storeName = "Store",
  size = "medium",
  className = "",
  showBorder = true,
  borderColor = "border-emerald-600",
  priority = "normal",
  ...props
}) {
  return (
    <ProgressiveLogoDisplay
      logoUrl={logoUrl}
      alt={`${storeName} logo`}
      size={size}
      shape="circle"
      priority={priority}
      className={cn(
        showBorder && `border-4 ${borderColor} shadow-lg`,
        className
      )}
      {...props}
    />
  );
}

/**
 * Enhanced SystemLogo Component with progressive loading
 */
export function ProgressiveSystemLogo({
  size = "large",
  className = "",
  priority = "high", // System logo typically has high priority
  ...props
}) {
  return (
    <ProgressiveLogoDisplay
      logoUrl={nexusLogo}
      fallbackUrl={nexusLogo}
      alt="Nexus Commerce"
      size={size}
      shape="rounded"
      priority={priority}
      className={className}
      {...props}
    />
  );
}

// Add shimmer animation to global CSS if not already present
const shimmerStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('progressive-logo-styles')) {
  const style = document.createElement('style');
  style.id = 'progressive-logo-styles';
  style.textContent = shimmerStyles;
  document.head.appendChild(style);
}

export default ProgressiveLogoDisplay;