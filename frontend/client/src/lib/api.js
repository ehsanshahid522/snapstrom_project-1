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

// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '');

async function parseJsonSafe(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function api(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
  const token = getToken();
  
  const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  try {
    const res = await fetch(fullUrl, {
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
    console.error('API Error:', error);
    throw error;
  }
}

