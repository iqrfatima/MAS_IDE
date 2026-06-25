import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi } from '../api/auth';
import { AuthResponse } from '../types';
import { logger } from '../utils/logger';

interface AuthContextProps {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setToken(stored);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);
    setToken(response.accessToken);
    localStorage.setItem('authToken', response.accessToken);
    queryClient.invalidateQueries();
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    queryClient.clear();
  };

  const value: AuthContextProps = {
    token,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};