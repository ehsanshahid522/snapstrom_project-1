import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api.js';
import { performanceMonitor } from './performance.js';

// Custom hook for optimized API calls with caching
export const useOptimizedApi = () => {
  const cacheRef = useRef(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (endpoint, options = {}, useCache = true) => {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (useCache && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      // Return cached data if it's less than 5 minutes old
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await performanceMonitor.measureApiCall(
        () => api(endpoint, options),
        endpoint
      );

      // Cache the result
      if (useCache) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Clear specific cache entry
  const clearCacheEntry = useCallback((endpoint, options = {}) => {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    cacheRef.current.delete(cacheKey);
  }, []);

  return {
    makeRequest,
    loading,
    error,
    clearCache,
    clearCacheEntry
  };
};

// Custom hook for optimized image loading
export const useOptimizedImage = (src, options = {}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return {
    loaded,
    error,
    imgRef
  };
};

// Custom hook for debounced search
export const useDebouncedSearch = (callback, delay = 300) => {
  const [query, setQuery] = useState('');
  const debouncedCallback = useCallback(
    performanceMonitor.debounce(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    if (query) {
      debouncedCallback(query);
    }
  }, [query, debouncedCallback]);

  return {
    query,
    setQuery
  };
};

// Custom hook for virtual scrolling optimization
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    setScrollTop
  };
};
