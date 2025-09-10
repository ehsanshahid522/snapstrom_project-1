// Frontend Configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://snapstrom-project-1.vercel.app'),
  
  // WebSocket Configuration
  WS_BASE_URL: import.meta.env.VITE_WS_URL || 
    (window.location.hostname === 'localhost' ? 'ws://localhost:3001' : 'wss://snapstrom-project-1.vercel.app'),
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // App Settings
  APP_NAME: 'SnapStream',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_UPLOAD: true,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_SEARCH: true,
  ENABLE_WEBSOCKET: true
};

// Helper function to get API URL
export function getApiUrl(path = '') {
  const baseUrl = config.API_BASE_URL;
  
  // If path is empty, return base API URL
  if (!path) {
    return `${baseUrl}/api`;
  }
  
  // Clean the path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If path already starts with /api, don't add another /api
  if (cleanPath.startsWith('/api/')) {
    return `${baseUrl}${cleanPath}`;
  }
  
  // Otherwise, add /api prefix
  return `${baseUrl}/api${cleanPath}`;
}

// Helper function to get WebSocket URL
export function getWsUrl(path = '') {
  const baseUrl = config.WS_BASE_URL;
  
  // If path is empty, return base WebSocket URL
  if (!path) {
    return baseUrl;
  }
  
  // Clean the path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}
