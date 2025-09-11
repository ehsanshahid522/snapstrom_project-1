import React from 'react';
import { safeRender } from '../utils/safeRender.js';

/**
 * SafeRender Component - Bulletproof wrapper for any dynamic content
 * This component ensures that no objects are ever rendered directly in JSX
 * Use this to wrap any potentially unsafe content
 */
const SafeRender = ({ children, fallback = '', className = '', ...props }) => {
  // If children is a function, call it and render the result safely
  if (typeof children === 'function') {
    try {
      const result = children();
      return <span className={className} {...props}>{safeRender(result)}</span>;
    } catch (error) {
      console.warn('SafeRender: Error in children function:', error);
      return <span className={className} {...props}>{fallback}</span>;
    }
  }

  // If children is already safe, render it directly
  if (typeof children === 'string' || typeof children === 'number' || typeof children === 'boolean') {
    return <span className={className} {...props}>{children}</span>;
  }

  // For any other type, use safeRender
  try {
    const safeContent = safeRender(children);
    return <span className={className} {...props}>{safeContent}</span>;
  } catch (error) {
    console.warn('SafeRender: Error rendering content:', error);
    return <span className={className} {...props}>{fallback}</span>;
  }
};

export default SafeRender;
