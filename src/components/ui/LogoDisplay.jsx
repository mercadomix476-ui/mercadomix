import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLogoCaching } from "@/hooks/useLogoCaching";
import { useLogoPerformance } from "@/hooks/useLogoPerformance";
import nexusLogo from "@/assets/nexuslogo.jpg";

/**
 * LogoDisplay Component - Dynamic logo rendering with fallback support
 * Implements requirements 1.5, 3.2, 3.3, 5.4
 * 
 * Features:
 * - Dynamic logo rendering based on provided URL
 * - Fallback to default logo when no custom logo exists
 * - Responsive sizing and aspect ratio preservation
 * - Loading states and error handling
 * - Accessibility support
 */
export function LogoDisplay({
  logoUrl,
  fallbackUrl = "/nexuslogo.jpg",
  alt = "Logo",
  className = "",
  size = "medium",
  shape = "rounded",
  showLoadingState = true,
  enableCaching = true,
  priority = "normal",
  onError,
  onLoad,
  ...props
}) {
  const { getCachedImage } = useLogoCaching();
  const { recordLoad } = useLogoPerformance();
  
  const [currentSrc, setCurrentSrc] = useState(logoUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState(null);

  // Size variants
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
    xlarge: "w-20 h-20",
    custom: "" // Allow custom sizing through className
  };

  // Shape variants
  const shapeClasses = {
    rounded: "rounded-lg",
    circle: "rounded-full",
    square: "rounded-none",
    custom: "" // Allow custom shape through className
  };

  // Update current source when logoUrl changes with caching
  useEffect(() => {
    if (logoUrl && logoUrl !== currentSrc) {
      loadImageWithCaching(logoUrl);
    }
  }, [logoUrl, currentSrc]);

  // Load image with caching support
  const loadImageWithCaching = async (url) => {
    if (!url) return;

    setIsLoading(true);
    setHasError(false);
    setImageLoaded(false);
    setLoadStartTime(performance.now());

    try {
      if (enableCaching) {
        // Use caching system
        const cachedImage = await getCachedImage(url, {
          priority,
          onProgress: (progress) => {
            // Could add progress indicator here if needed
          }
        });

        if (cachedImage) {
          setCurrentSrc(cachedImage.url);
          setIsLoading(false);
          setImageLoaded(true);

          // Record performance metrics
          const loadTime = performance.now() - loadStartTime;
          recordLoad({
            url,
            loadTime,
            cached: cachedImage.cached,
            source: 'logo_display'
          });

          if (onLoad) {
            onLoad({
              url: cachedImage.url,
              cached: cachedImage.cached,
              loadTime: cachedImage.loadTime
            });
          }
          return;
        }
      }

      // Fallback to regular loading
      setCurrentSrc(url);
      
    } catch (error) {
      console.error('Failed to load cached image:', error);
      
      // Try fallback if main image fails
      if (url !== fallbackUrl) {
        loadImageWithCaching(fallbackUrl);
      } else {
        setIsLoading(false);
        setHasError(true);
        
        // Record error metrics
        const loadTime = performance.now() - loadStartTime;
        recordLoad({
          url,
          loadTime,
          cached: false,
          error: error.message,
          source: 'logo_display'
        });
      }
    }
  };

  // Handle image load success
  const handleLoad = (event) => {
    setIsLoading(false);
    setHasError(false);
    setImageLoaded(true);
    
    // Record performance metrics for non-cached loads
    if (loadStartTime && !enableCaching) {
      const loadTime = performance.now() - loadStartTime;
      recordLoad({
        url: currentSrc,
        loadTime,
        cached: false,
        source: 'logo_display_fallback'
      });
    }
    
    if (onLoad) {
      onLoad(event);
    }
  };

  // Handle image load error with fallback logic
  const handleError = (event) => {
    setIsLoading(false);
    
    // Record error metrics
    if (loadStartTime) {
      const loadTime = performance.now() - loadStartTime;
      recordLoad({
        url: currentSrc,
        loadTime,
        cached: false,
        error: 'Image load failed',
        source: 'logo_display_error'
      });
    }
    
    // If we're not already using the fallback, try it
    if (currentSrc !== fallbackUrl) {
      loadImageWithCaching(fallbackUrl);
      return;
    }
    
    // If even the fallback fails, mark as error
    setHasError(true);
    setImageLoaded(false);
    
    if (onError) {
      onError(event);
    }
  };

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div 
      className={cn(
        "bg-slate-200 animate-pulse flex items-center justify-center overflow-hidden flex-shrink-0",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-label={`Loading ${alt}`}
    >
      <div className="w-1/2 h-1/2 bg-slate-300 rounded opacity-50" />
    </div>
  );

  // Error placeholder component
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

  // Show loading state if enabled and image is loading
  if (showLoadingState && isLoading && !imageLoaded) {
    return <LoadingPlaceholder />;
  }

  // Show error placeholder if image failed to load
  if (hasError) {
    return <ErrorPlaceholder />;
  }

  return (
    <div 
      className={cn(
        "overflow-hidden flex-shrink-0",
        sizeClasses[size],
        shapeClasses[shape],
        className
      )}
      role="img"
      aria-label={alt}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  );
}

/**
 * StoreLogo Component - Specialized logo display for store branding
 * Uses LogoDisplay with store-specific defaults and styling
 */
export function StoreLogo({
  logoUrl,
  storeName = "Store",
  size = "medium",
  className = "",
  showBorder = true,
  borderColor = "border-emerald-600",
  ...props
}) {
  // Tamanhos simples
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16",
    xlarge: "w-20 h-20"
  };

  return (
    <div className={cn("flex-shrink-0", sizeClasses[size], className)}>
      <img
        src={logoUrl || "/nexuslogo.jpg"}
        alt={`${storeName} logo`}
        className={cn(
          "w-full h-full object-cover rounded-full transition-all duration-200 hover:scale-105",
          showBorder && `border-4 ${borderColor} shadow-lg hover:shadow-xl`
        )}
        loading="eager"
        {...props}
      />
    </div>
  );
}

/**
 * SystemLogo Component - Specialized logo display for system branding
 * Always uses the Nexus Commerce logo, typically for login screens
 */
export function SystemLogo({
  size = "large",
  className = "",
  ...props
}) {
  // Tamanhos simples
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16",
    xlarge: "w-20 h-20"
  };

  return (
    <div className={cn("flex-shrink-0", sizeClasses[size], className)}>
      <img
        src="/nexuslogo.jpg"
        alt="Nexus Commerce"
        className="w-full h-full object-contain"
        loading="eager"
        {...props}
      />
    </div>
  );
}