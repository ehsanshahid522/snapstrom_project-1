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
  if (!path) {
    return `${baseUrl}/api`;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/api${cleanPath}`;
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
