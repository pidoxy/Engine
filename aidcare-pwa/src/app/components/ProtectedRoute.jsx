// src/app/components/ProtectedRoute.jsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path if context is elsewhere
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have this

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait until authentication status is resolved
    }

    if (!isAuthenticated) {
      console.log("ProtectedRoute: Not authenticated, redirecting to login from:", pathname);
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role.toLowerCase())) {
      console.log(`ProtectedRoute: Role mismatch. User role: ${user.role}, Allowed: ${allowedRoles}. Redirecting from:`, pathname);
      // You might want a dedicated unauthorized page or redirect to a default dashboard
      router.replace('/dashboard'); // Or '/unauthorized'
    }
  }, [isAuthenticated, user, authIsLoading, router, pathname, allowedRoles]);

  if (authIsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner />
        <p style={{ marginLeft: '10px' }}>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state is usually brief as useEffect will redirect.
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Redirecting to login...</p>
        <LoadingSpinner />
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role.toLowerCase())) {
    // This state is also usually brief.
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Access Denied. Redirecting...</p>
        <LoadingSpinner />
      </div>
    );
  }

  // If authenticated and role matches (or no specific roles required beyond being authenticated)
  return <>{children}</>;
}