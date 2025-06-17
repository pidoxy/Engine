"use client";

import { AuthProvider } from './context/AuthContext';
import PWAHelper from './components/PWAHelper';

export function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <PWAHelper />
      {children}
    </AuthProvider>
  );
} 