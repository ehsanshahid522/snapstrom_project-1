import { useState, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { api } from '../lib/api';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken, removeToken] = useLocalStorage('token', null);
  const [username, setUsername, removeUsername] = useLocalStorage('username', null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await api('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false
      });

      if (response.token) {
        setToken(response.token);
        setUsername(response.user.username);
        setUser(response.user);
        return { success: true, user: response.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api('/auth/register', {
        method: 'POST',
        body: { username, email, password },
        auth: false
      });

      if (response.token) {
        setToken(response.token);
        setUsername(response.user.username);
        setUser(response.user);
        return { success: true, user: response.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    removeUsername();
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api('/profile/update', {
        method: 'PUT',
        body: profileData
      });
      
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  };
}
