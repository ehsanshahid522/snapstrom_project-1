export function getToken() {
  return localStorage.getItem('token');
}

export function setAuth({ token, username }) {
  if (token) localStorage.setItem('token', token);
  if (username) localStorage.setItem('username', username);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

export function getUsername() {
  return localStorage.getItem('username');
}

// Base URL for the backend API - use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://snapstream-backend.vercel.app');

// Fallback URLs for production
const FALLBACK_URLS = [
  'https://snapstream-backend.vercel.app',
  'https://snapstream-api.vercel.app',
  'https://snapstream-backend.onrender.com'
];

async function parseJsonSafe(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function tryFetch(url, options, retries = 2) {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;
    
    // If unauthorized, don't retry
    if (response.status === 401) return response;
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return tryFetch(url, options, retries - 1);
    }
    throw error;
  }
}

export async function api(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
  const token = getToken();
  
  // Try primary URL first
  let fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  try {
    const res = await tryFetch(fullUrl, {
      method,
      headers: {
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...headers
      },
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body
    });
    
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
        try { window.location.href = '/login'; } catch {}
      }
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  } catch (error) {
    // If primary URL fails and we're in production, try fallback URLs
    if (window.location.hostname !== 'localhost' && !path.startsWith('http')) {
      for (const fallbackUrl of FALLBACK_URLS) {
        if (fallbackUrl === API_BASE_URL) continue; // Skip if it's the same as primary
        try {
          const fallbackFullUrl = `${fallbackUrl}${path}`;
          const res = await tryFetch(fallbackFullUrl, {
            method,
            headers: {
              ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
              ...(auth && token ? { 'Authorization': 'Bearer ' + token } : {}),
              ...headers
            },
            body: body && !(body instanceof FormData) ? JSON.stringify(body) : body
          });
          
          const data = await parseJsonSafe(res);
          if (!res.ok) {
            if (res.status === 401) {
              clearAuth();
              try { window.location.href = '/login'; } catch {}
            }
            const err = new Error(data.message || `HTTP ${res.status}`);
            err.status = res.status;
            err.body = data;
            throw err;
          }
          return data;
        } catch (fallbackError) {
          console.warn(`Fallback URL ${fallbackUrl} failed:`, fallbackError);
          continue;
        }
      }
    }
    throw error;
  }
}

