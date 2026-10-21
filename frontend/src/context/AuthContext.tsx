import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  register: (fullName: string, username: string, password: string, phone: string) => Promise<{ success: boolean; message: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  updatePhone: (phone: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smart_classroom_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('smart_classroom_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smart_classroom_user');
      localStorage.removeItem('smart_classroom_token');
    }
  }, [user]);

  const register = async (fullName: string, username: string, password: string, phone: string) => {
    try {
      const response = await api.auth.register(fullName, username, password, phone);
      if (response.data.success) {
        return { success: true, message: response.data.message || 'Registration successful. Please login.' };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Registration failed.';
      return { success: false, message: msg };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.auth.login(username, password);
      if (response.data.success) {
        const loggedUser: User = response.data.user;
        const token = response.data.token;
        if (token) {
          localStorage.setItem('smart_classroom_token', token);
        }
        setUser(loggedUser);
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: 'Invalid credentials.' };
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Login failed.';
      return { success: false, message: msg };
    }
  };

  const updatePhone = async (phone: string) => {
    try {
      const response = await api.auth.updatePhone(phone);
      if (response.data.success) {
        const updatedUser = {
          id: response.data.id || 1,
          username: response.data.username || 'admin',
          full_name: response.data.full_name || 'Classroom Administrator',
          phone
        };
        setUser(updatedUser);
        localStorage.setItem('smart_classroom_user', JSON.stringify(updatedUser));
        return { success: true, message: `Alert number saved (${phone}).` };
      }
      return { success: false, message: 'Failed to update alert number.' };
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to update alert number.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setUser(null);
      localStorage.removeItem('smart_classroom_user');
      localStorage.removeItem('smart_classroom_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, register, login, updatePhone, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
