// src/app/context/AuthContext.js
"use client"; // This context provider will be used in client components

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection

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
    try {
      const token = localStorage.getItem('aidcareAuthToken');
      const userString = localStorage.getItem('aidcareUser');
      if (token && userString) {
        const user = JSON.parse(userString);
        // TODO: Optionally verify token with a backend endpoint here
        // If token is valid, dispatch LOGIN_SUCCESS, else dispatch LOGOUT
        console.log("AuthContext: Found token and user in localStorage", {token, user});
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      } else {
        console.log("AuthContext: No token/user in localStorage.");
        dispatch({ type: 'INITIALIZE', payload: {} }); // No persisted session
      }
    } catch (error) {
        console.error("AuthContext: Error loading auth state from localStorage", error);
        dispatch({ type: 'INITIALIZE', payload: {} }); // Error, assume no session
    }
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