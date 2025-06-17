// src/app/context/AuthContext.js
"use client"; // This context provider will be used in client components

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection
import { userService } from '../lib/services';

const AuthStateContext = createContext(undefined);
const AuthDispatchContext = createContext(undefined);

const initialState = {
  isAuthenticated: false,
  user: null, // Will store { id, email, role, organization_id, etc. }
  token: null,
  isLoading: true, // Start as true to check for persisted session
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE': // When checking localStorage finishes
      return {
        ...state,
        isAuthenticated: !!action.payload.token && !!action.payload.user,
        user: action.payload.user || null,
        token: action.payload.token || null,
        isLoading: false,
      };
    case 'LOGIN_REQUEST':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false, // Set loading to false after logout
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing token in localStorage on initial app load
    // This provides basic session persistence across page reloads.
    // For production, consider more secure token storage or server-side session checks.
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('aidcareAuthToken');
        const userString = localStorage.getItem('aidcareUser');
        
        if (token && userString) {
          const user = JSON.parse(userString);
          
          // Verify token with backend
          try {
            const currentUser = await userService.getCurrentUser();
            console.log("AuthContext: Token verified, user data:", currentUser);
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                token, 
                user: currentUser.data || currentUser 
              } 
            });
          } catch (error) {
            console.log("AuthContext: Token verification failed", error);
            // Token is invalid, clear storage
            localStorage.removeItem('aidcareAuthToken');
            localStorage.removeItem('aidcareUser');
            dispatch({ type: 'INITIALIZE', payload: {} });
          }
        } else {
          console.log("AuthContext: No token/user in localStorage.");
          dispatch({ type: 'INITIALIZE', payload: {} }); // No persisted session
        }
      } catch (error) {
        console.error("AuthContext: Error loading auth state from localStorage", error);
        dispatch({ type: 'INITIALIZE', payload: {} }); // Error, assume no session
      }
    };

    initializeAuth();
  }, []); // Run only once on mount

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}

export function useAuthDispatch() {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error('useAuthDispatch must be used within an AuthProvider');
  }
  return context;
}

// Helper functions for authentication actions
export function useAuth() {
  const state = useAuthState();
  const dispatch = useAuthDispatch();
  const router = useRouter();

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_REQUEST' });
      
      const response = await userService.login(credentials);
      const { token, user } = response.data || response;
      
      // Store in localStorage
      localStorage.setItem('aidcareAuthToken', token);
      localStorage.setItem('aidcareUser', JSON.stringify(user));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { token, user } 
      });
      
      return { success: true, data: response };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('aidcareAuthToken');
    localStorage.removeItem('aidcareUser');
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('aidcareUser', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return {
    ...state,
    login,
    logout,
    updateUser,
  };
}