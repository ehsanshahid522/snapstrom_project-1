// ULTIMATE SAFE RENDER UTILITY - Prevents ALL React error #31
// This is a bulletproof solution that ensures NO objects are ever rendered in JSX

/**
 * SAFE RENDER WRAPPER - Ultimate protection against React error #31
 * This function ensures that NO objects are ever rendered directly in JSX
 * @param {any} value - The value to render
 * @returns {string} - Safe string for JSX rendering
 */
export function safeRender(value) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Handle primitives
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);

  // CRITICAL: Handle objects to prevent Error #31
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      try {
        return value.map(item => safeRender(item)).join(', ');
      } catch (e) {
        return '[Array]';
      }
    }

    // Handle timestamp objects specifically
    if (value.timestamp || value.createdAt || value.lastMessageAt || value.uploadTime || value.date || value.time || value.$date) {
      return safeTimestampToString(value);
    }

    // Recursively check for timestamp keys if it's an object (AGGRESSIVE MODE)
    const keys = Object.keys(value);
    const timestampKey = keys.find(k => k.toLowerCase().includes('timestamp') || k === '$date' || k === 'createdAt');
    if (timestampKey && value[timestampKey]) {
      return safeTimestampToString(value[timestampKey]);
    }

    // Handle objects with common string properties
    if (value.content !== undefined && value.content !== null && typeof value.content !== 'object') return String(value.content);
    if (value.text !== undefined && value.text !== null && typeof value.text !== 'object') return String(value.text);
    if (value.message !== undefined && value.message !== null && typeof value.message !== 'object') return String(value.message);
    if (value.value !== undefined && value.value !== null && typeof value.value !== 'object') return String(value.value);
    if (value.name !== undefined && value.name !== null && typeof value.name !== 'object') return String(value.name);
    if (value.title !== undefined && value.title !== null && typeof value.title !== 'object') return String(value.title);
    if (value.username !== undefined && value.username !== null && typeof value.username !== 'object') return String(value.username);
    if (value.caption !== undefined && value.caption !== null && typeof value.caption !== 'object') return String(value.caption);
    if (value.bio !== undefined && value.bio !== null && typeof value.bio !== 'object') return String(value.bio);
    if (value.label !== undefined && value.label !== null && typeof value.label !== 'object') return String(value.label);

    // Check if it's an Error object
    if (value instanceof Error) return value.message;

    // Check if it's a Mongoose ObjectId or similar
    if (typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str !== '[object Object]') return str;
      } catch (e) {
        // Ignore error
      }
    }

    // Try JSON stringify as last resort
    try {
      const stringified = JSON.stringify(value);
      if (stringified === '{}') return '[Object]';
      // If the stringified version is still short, return it
      if (stringified.length < 100) return stringified;
      return '[Object Data]';
    } catch (error) {
      return '[Object]';
    }
  }

  // Fallback
  try {
    const fallback = String(value);
    if (typeof fallback === 'object') return '[Object]';
    return fallback;
  } catch (error) {
    return '';
  }
}

/**
 * SAFE TIMESTAMP TO STRING - Enhanced version
 * @param {any} timestamp - The timestamp to convert
 * @returns {string} - ISO string representation of the timestamp
 */
export function safeTimestampToString(timestamp) {
  // Handle null/undefined
  if (timestamp === null || timestamp === undefined) {
    return new Date().toISOString();
  }

  // Handle strings
  if (typeof timestamp === 'string') {
    // Validate that it's a valid date string
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date().toISOString() : timestamp;
  }

  // Handle objects
  if (typeof timestamp === 'object' && timestamp !== null) {
    // Handle Mongoose timestamp objects with nested properties
    if (timestamp.timestamp && typeof timestamp.timestamp === 'object') {
      return safeTimestampToString(timestamp.timestamp);
    }
    if (timestamp.createdAt && typeof timestamp.createdAt === 'object') {
      return safeTimestampToString(timestamp.createdAt);
    }
    if (timestamp.lastMessageAt && typeof timestamp.lastMessageAt === 'object') {
      return safeTimestampToString(timestamp.lastMessageAt);
    }
    if (timestamp.uploadTime && typeof timestamp.uploadTime === 'object') {
      return safeTimestampToString(timestamp.uploadTime);
    }

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

    // Handle Mongoose Date objects
    if (timestamp.$date) {
      return safeTimestampToString(timestamp.$date);
    }

    // Try to convert to string
    try {
      const str = timestamp.toString();
      // If toString returns '[object Object]', try JSON.stringify
      if (str === '[object Object]') {
        return new Date().toISOString();
      }
      return str;
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
 * SAFE FORMAT TIME AGO - Enhanced version with bulletproof object handling
 * @param {any} timestamp - The timestamp to format
 * @returns {string} - Formatted time string
 */
export function safeFormatTimeAgo(timestamp) {
  // First ensure the timestamp is converted to a safe string
  const safeTimestamp = safeRender(timestamp);

  // If it's not a valid timestamp, return default
  if (!safeTimestamp || safeTimestamp === '[Object]' || safeTimestamp === '') {
    return 'Recently';
  }

  try {
    const date = new Date(safeTimestamp);
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

/**
 * SAFE OBJECT TO STRING - Enhanced version
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
