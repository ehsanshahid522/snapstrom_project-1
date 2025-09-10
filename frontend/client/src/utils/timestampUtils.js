// Comprehensive timestamp utility functions

/**
 * Safely converts any timestamp format to a string
 * @param {any} timestamp - The timestamp to convert
 * @returns {string} - ISO string representation of the timestamp
 */
export function safeTimestampToString(timestamp) {
  if (!timestamp) return new Date().toISOString();
  
  if (typeof timestamp === 'string') {
    // Validate that it's a valid date string
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date().toISOString() : timestamp;
  }
  
  if (typeof timestamp === 'object' && timestamp !== null) {
    // Handle various object formats
    if (timestamp.timestamp) return safeTimestampToString(timestamp.timestamp);
    if (timestamp.createdAt) return safeTimestampToString(timestamp.createdAt);
    if (timestamp.lastMessageAt) return safeTimestampToString(timestamp.lastMessageAt);
    if (timestamp.uploadTime) return safeTimestampToString(timestamp.uploadTime);
    if (timestamp.date) return safeTimestampToString(timestamp.date);
    if (timestamp.time) return safeTimestampToString(timestamp.time);
    
    // If it's a Date object
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();
    }
    
    // Try to convert to string
    try {
      return timestamp.toString();
    } catch (error) {
      return new Date().toISOString();
    }
  }
  
  // For numbers (Unix timestamps)
  if (typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  
  // Fallback
  try {
    return new Date(timestamp).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Safely converts any object to a string for JSX rendering
 * @param {any} obj - The object to convert
 * @returns {string} - String representation safe for JSX
 */
export function safeObjectToString(obj) {
  if (obj === null || obj === undefined) return '';
  
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'boolean') return String(obj);
  
  if (typeof obj === 'object') {
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => safeObjectToString(item)).join(', ');
    }
    
    // Handle objects with common properties
    if (obj.content) return safeObjectToString(obj.content);
    if (obj.text) return safeObjectToString(obj.text);
    if (obj.message) return safeObjectToString(obj.message);
    if (obj.value) return safeObjectToString(obj.value);
    if (obj.name) return safeObjectToString(obj.name);
    if (obj.title) return safeObjectToString(obj.title);
    
    // Try JSON stringify as last resort
    try {
      return JSON.stringify(obj);
    } catch (error) {
      return '[Object]';
    }
  }
  
  return String(obj);
}

/**
 * Formats a timestamp for display
 * @param {any} timestamp - The timestamp to format
 * @returns {string} - Formatted time string
 */
export function formatTimeAgo(timestamp) {
  const dateString = safeTimestampToString(timestamp);
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    return 'Recently';
  }
}
