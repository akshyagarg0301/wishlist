import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await api.getMe();
      setUser(data.userId);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await api.login(email, password);
    setUser(data.userId);
    return data;
  }

  async function signup(name, email, password) {
    return api.createUser(name, email, password);
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}