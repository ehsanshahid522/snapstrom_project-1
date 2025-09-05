// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) { // More than one frame (16ms)
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  },

  // Measure API call performance
  measureApiCall: async (apiCall, endpoint) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 1000) { // More than 1 second
        console.warn(`Slow API call detected for ${endpoint}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`API call failed for ${endpoint} after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Debounce function for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for performance
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Image optimization utilities
export const imageOptimizer = {
  // Lazy load images
  lazyLoadImage: (imgRef, src) => {
    if (imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              imgRef.current.src = src;
              observer.unobserve(imgRef.current);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imgRef.current);
    }
  },

  // Preload critical images
  preloadImage: (src) => {
    const img = new Image();
    img.src = src;
  },

  // Get optimized image URL
  getOptimizedImageUrl: (originalUrl, width = 800, quality = 80) => {
    if (!originalUrl) return '';
    
    // If it's already an optimized URL, return as is
    if (originalUrl.includes('w_') || originalUrl.includes('q_')) {
      return originalUrl;
    }
    
    // Add optimization parameters
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}w_${width}&q_${quality}&f_auto`;
  }
};

// Memory management utilities
export const memoryManager = {
  // Clean up unused objects
  cleanup: () => {
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    }
  },

  // Monitor memory usage
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      return {
        used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(window.performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
};
