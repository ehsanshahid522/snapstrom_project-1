// Frontend Configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''),
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // App Settings
  APP_NAME: 'SnapStream',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_UPLOAD: true,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_SEARCH: true
};

// Helper function to get API URL
export function getApiUrl(path = '') {
  const baseUrl = config.API_BASE_URL;
  
  // Debug logging
  console.log('🔧 getApiUrl debug:', {
    path,
    baseUrl,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isLocalhost: typeof window !== 'undefined' ? window.location.hostname === 'localhost' : false
  });
  
  // If path is empty, return base API URL
  if (!path) {
    return `${baseUrl}/api`;
  }
  
  // Clean the path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If path already starts with /api, don't add another /api
  if (cleanPath.startsWith('/api/')) {
    const result = `${baseUrl}${cleanPath}`;
    console.log('🔧 getApiUrl result (path starts with /api/):', result);
    return result;
  }
  
  // Otherwise, add /api prefix
  const result = `${baseUrl}/api${cleanPath}`;
  console.log('🔧 getApiUrl result (adding /api):', result);
  return result;
}

// Helper function to check if running locally
export function isLocalhost() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}

// Helper function to check if running in production
export function isProduction() {
  return config.NODE_ENV === 'production';
}
