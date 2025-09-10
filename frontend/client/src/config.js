// Frontend Configuration - Using relative URLs to eliminate CORS
export const config = {
  // API Configuration - Use relative URLs to avoid CORS
  API_BASE_URL: import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : ''),
  
  // WebSocket Configuration - Disabled for production to avoid CORS
  WS_BASE_URL: import.meta.env.VITE_WS_URL || 
    (window.location.hostname === 'localhost' ? 'ws://localhost:3001' : ''),
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // App Settings
  APP_NAME: 'SnapStream',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_UPLOAD: true,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_SEARCH: true,
  ENABLE_WEBSOCKET: window.location.hostname === 'localhost' // Only enable WebSocket locally
};

// Helper function to get API URL - Using relative URLs to eliminate CORS
export function getApiUrl(path = '') {
  const baseUrl = config.API_BASE_URL;
  
  // If path is empty, return base API URL
  if (!path) {
    return baseUrl ? `${baseUrl}/api` : '/api';
  }
  
  // Clean the path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If path already starts with /api, don't add another /api
  if (cleanPath.startsWith('/api/')) {
    return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
  }
  
  // Otherwise, add /api prefix
  return baseUrl ? `${baseUrl}/api${cleanPath}` : `/api${cleanPath}`;
}

// Helper function to get WebSocket URL (disabled in production)
export function getWsUrl(path = '') {
  return ''; // WebSocket disabled in production
}
