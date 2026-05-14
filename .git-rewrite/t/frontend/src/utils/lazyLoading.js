/**
 * Lazy Loading Utilities
 * Provides code splitting, preloading, and error handling for dynamic imports
 */

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

/**
 * Enhanced lazy loading with retry logic
 */
export const lazyWithRetry = (importFn, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            
            console.warn(`Import failed, retrying... (${retriesLeft} attempts left)`);
            setTimeout(() => attemptImport(retriesLeft - 1), 1000);
          });
      };

      attemptImport(retries);
    });
  });
};

/**
 * Preload component for faster navigation
 */
export const preloadComponent = (importFn) => {
  importFn().catch((error) => {
    console.warn('Preload failed:', error.message);
  });
};

/**
 * Loading fallback component
 */
export const LoadingFallback = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Lazy route wrapper with suspense
 */
export const LazyRoute = ({ component: Component, fallback = <LoadingFallback />, ...props }) => (
  <Suspense fallback={fallback}>
    <Component {...props} />
  </Suspense>
);

/**
 * Prefetch on hover/focus
 */
export const usePrefetch = (importFn) => {
  const handlePrefetch = () => {
    preloadComponent(importFn);
  };

  return {
    onMouseEnter: handlePrefetch,
    onFocus: handlePrefetch,
  };
};

/**
 * Image lazy loading with intersection observer
 */
export const LazyImage = ({ src, alt, className, placeholder = '/placeholder.svg' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc} alt={alt} className={className} />;
};

export default {
  lazyWithRetry,
  preloadComponent,
  LoadingFallback,
  LazyRoute,
  usePrefetch,
  LazyImage,
};
