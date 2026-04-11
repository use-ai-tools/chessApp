import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) logout();
        return;
      }
      const data = await res.json();
      const updatedUser = data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return data;
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, [token]);

  const updateWallet = (newBalance) => {
    if (user) {
      const updated = { ...user, wallet: newBalance };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    }
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) logout();
      throw new Error(data.message || 'Server error');
    }
    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, authFetch, refreshUser, updateWallet }}>
      {children}
    </AuthContext.Provider>
  );
};