// src/app/context/AuthContext.js
"use client"; // This context provider will be used in client components

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For redirection
import { userService } from '../lib/services/userService';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardUrl, setDashboardUrl] = useState('/login');
  const router = useRouter();

  const updateUserAndUrl = useCallback((userData) => {
    console.log('Updating user and URL with:', userData);
    setUser(userData);
    setIsAuthenticated(!!userData);
    
    if (userData) {
      let newDashboardUrl = '/login';
      switch (userData.role) {
        case 'admin':
        case 'organization':
          newDashboardUrl = '/dashboard/admin';
          break;
        case 'consultant':
          newDashboardUrl = '/dashboard/doctor';
          break;
        case 'chw':
          newDashboardUrl = '/dashboard/chw';
          break;
        default:
          newDashboardUrl = '/login';
          break;
      }
      console.log('Setting dashboard URL to:', newDashboardUrl);
      setDashboardUrl(newDashboardUrl);
    } else {
      setDashboardUrl('/login');
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    console.log('Initializing auth...');
    const token = localStorage.getItem('jwt_token');
    console.log('Found token:', !!token);
    
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await userService.getCurrentUser();
        console.log('Got current user:', response.data);
        updateUserAndUrl(response.data.data);
      } catch (e) {
        console.error("Session expired or invalid, logging out.", e);
        localStorage.removeItem('jwt_token');
        delete api.defaults.headers.common['Authorization'];
        updateUserAndUrl(null);
      }
    } else {
      updateUserAndUrl(null);
    }
    setIsLoading(false);
  }, [updateUserAndUrl]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    console.log('Attempting login...');
    try {
      setIsLoading(true);
      const response = await userService.login(credentials);
      console.log('Login response:', response.data);
      
      const { token, user: loggedInUser } = response.data.data;
      
      if (!token || !loggedInUser) {
        throw new Error('Invalid login response - missing token or user data');
      }
      
      localStorage.setItem('jwt_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      updateUserAndUrl(loggedInUser);

      // Compute dashboard URL directly based on user role
      let newDashboardUrl = '/login';
      switch (loggedInUser.role) {
        case 'admin':
        case 'organization':
          newDashboardUrl = '/dashboard/admin';
          break;
        case 'consultant':
          newDashboardUrl = '/dashboard/doctor';
          break;
        case 'chw':
          newDashboardUrl = '/dashboard/chw';
          break;
        default:
          newDashboardUrl = '/login';
          break;
      }
      console.log('Redirecting to:', newDashboardUrl);
      router.push(newDashboardUrl);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out...');
    localStorage.removeItem('jwt_token');
    delete api.defaults.headers.common['Authorization'];
    updateUserAndUrl(null);
    router.push('/login');
  }, [router, updateUserAndUrl]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    dashboardUrl,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};