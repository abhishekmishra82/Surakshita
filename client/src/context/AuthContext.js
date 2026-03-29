import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const ANON_KEY = 'surakshita_anon_user';

const createAnonUser = () => ({
  _id: 'anon_' + Math.random().toString(36).slice(2),
  name: 'Guest',
  email: null,
  isAnonymous: true,
  isVerified: true,
  darkMode: false,
  stealthMode: false,
  safeWord: 'help me',
  shakeThreshold: 25,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for anonymous session first
    const anonRaw = localStorage.getItem(ANON_KEY);
    if (anonRaw) {
      try {
        setUser(JSON.parse(anonRaw));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(ANON_KEY);
      }
    }

    // Check for JWT session
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.removeItem(ANON_KEY);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const loginAnonymous = () => {
    const anonUser = createAnonUser();
    localStorage.setItem(ANON_KEY, JSON.stringify(anonUser));
    setUser(anonUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(ANON_KEY);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      // Persist anon user updates
      if (prev?.isAnonymous) {
        localStorage.setItem(ANON_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAnonymous, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
