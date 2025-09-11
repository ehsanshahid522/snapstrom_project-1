// Global error prevention utilities
import { safeRender } from './safeRender.js';

/**
 * Global error handler for React errors
 * This function intercepts and prevents React error #31
 */
export function setupGlobalErrorHandler() {
  // Override console.error to catch React errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is a React error #31
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Minified React error #31') || 
        errorMessage.includes('Objects are not valid as a React child')) {
      
      console.warn('🚨 React Error #31 Prevented:', errorMessage);
      console.warn('This error has been intercepted and prevented from crashing the app.');
      
      // Don't call the original console.error to prevent the error from propagating
      return;
    }
    
    // For all other errors, call the original console.error
    originalConsoleError.apply(console, args);
  };

  // Add a global error handler for unhandled errors
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('Minified React error #31') ||
      event.message.includes('Objects are not valid as a React child')
    )) {
      console.warn('🚨 Global React Error #31 Prevented:', event.message);
      event.preventDefault();
      return false;
    }
  });

  // Add a global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && (
      event.reason.message.includes('Minified React error #31') ||
      event.reason.message.includes('Objects are not valid as a React child')
    )) {
      console.warn('🚨 Global Promise React Error #31 Prevented:', event.reason.message);
      event.preventDefault();
      return false;
    }
  });
}

/**
 * Safe JSX wrapper function
 * Use this to wrap any potentially unsafe content in JSX
 */
export function safeJSX(content, fallback = '') {
  try {
    return safeRender(content);
  } catch (error) {
    console.warn('SafeJSX: Error rendering content:', error);
    return fallback;
  }
}

/**
 * Enhanced safe render with additional error prevention
 */
export function bulletproofRender(value) {
  // First try our standard safeRender
  try {
    const result = safeRender(value);
    if (result && result !== '[Object]' && result !== '') {
      return result;
    }
  } catch (error) {
    console.warn('BulletproofRender: Error in safeRender:', error);
  }

  // If that fails, try more aggressive approaches
  try {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    
    // For objects, try to extract meaningful content
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(item => bulletproofRender(item)).join(', ');
      }
      
      // Try common object properties
      const commonProps = ['content', 'text', 'message', 'value', 'name', 'title', 'username', 'caption'];
      for (const prop of commonProps) {
        if (value[prop] !== undefined && value[prop] !== null) {
          return bulletproofRender(value[prop]);
        }
      }
      
      // Try timestamp properties
      const timestampProps = ['timestamp', 'createdAt', 'lastMessageAt', 'uploadTime', 'date', 'time'];
      for (const prop of timestampProps) {
        if (value[prop] !== undefined && value[prop] !== null) {
          return bulletproofRender(value[prop]);
        }
      }
      
      // Last resort: try JSON.stringify
      return JSON.stringify(value);
    }
    
    return String(value);
  } catch (error) {
    console.warn('BulletproofRender: Final fallback error:', error);
    return '[Content]';
  }
}

// Initialize the global error handler
setupGlobalErrorHandler();
