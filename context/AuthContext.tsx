'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api'; // Adjusted import statement

export interface User { // Add export here
  id: number; // Add this line if it's not already present
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (user: User) => void;
  logout: () => void; // Add logout function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Retrieve user from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/login', { email, password });
      setUser(response.data.user);
      // Handle successful login (e.g., store token, redirect)
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/register', { email, password, name });
      setUser(response.data.user);
      // Handle successful registration (e.g., store token, redirect)
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user'); // Remove user from localStorage
  };

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, login, logout }}>
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