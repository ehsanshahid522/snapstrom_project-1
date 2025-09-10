// Username validation utilities

/**
 * Validates if a username is in a valid format
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidUsernameFormat(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Trim whitespace
  const trimmed = username.trim();
  
  // Check if empty after trimming
  if (trimmed.length === 0) {
    return false;
  }
  
  // Check length (1-30 characters)
  if (trimmed.length < 1 || trimmed.length > 30) {
    return false;
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen, spaces)
  // Allow spaces but not at start/end
  const validPattern = /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-\s]*[a-zA-Z0-9_\-]$|^[a-zA-Z0-9_\-]$/;
  
  return validPattern.test(trimmed);
}

/**
 * Sanitizes a username for URL usage
 * @param {string} username - The username to sanitize
 * @returns {string} - Sanitized username
 */
export function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  // Trim whitespace
  const trimmed = username.trim();
  
  // Replace multiple spaces with single space
  const normalized = trimmed.replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Checks if a username exists by making an API call
 * @param {string} username - The username to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
export async function checkUserExists(username) {
  if (!isValidUsernameFormat(username)) {
    return false;
  }
  
  try {
    const { api } = await import('../lib/api.js');
    await api(`/api/profile/${encodeURIComponent(username)}`);
    return true;
  } catch (error) {
    return error.status !== 404; // Return true if error is not 404 (user exists but other error)
  }
}

/**
 * Navigates to a profile with validation
 * @param {string} username - The username to navigate to
 * @param {Function} navigate - React Router navigate function
 */
export async function navigateToProfile(username, navigate) {
  const sanitized = sanitizeUsername(username);
  
  if (!isValidUsernameFormat(sanitized)) {
    console.warn('Invalid username format:', username);
    // Still navigate but let the Profile component handle the error
  }
  
  navigate(`/profile/${encodeURIComponent(sanitized)}`);
}

/**
 * Creates a safe profile URL
 * @param {string} username - The username
 * @returns {string} - Safe profile URL
 */
export function createProfileUrl(username) {
  const sanitized = sanitizeUsername(username);
  return `/profile/${encodeURIComponent(sanitized)}`;
}
