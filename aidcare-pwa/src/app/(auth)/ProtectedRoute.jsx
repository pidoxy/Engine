// src/app/components/auth/ProtectedRoute.js (Example)
"use client";
import { useAuthState } from '../context/AuthContext'; // Adjust path
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner'; // Your loading spinner

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${pathname}`); // Redirect to login if not auth'd
    } else if (!isLoading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      router.replace('/unauthorized'); // Or to a generic dashboard / home
    }
  }, [isAuthenticated, user, isLoading, router, pathname, allowedRoles]);

  if (isLoading || (!isAuthenticated && pathname !== '/login')) { 
    // Show loader while checking auth or if redirecting
    // Avoid showing loader on login page itself if not authenticated
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><LoadingSpinner /></div>;
  }
  
  if (isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      // Still show loader while redirecting to prevent flashing content
      return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><LoadingSpinner /></div>;
  }

  if (isAuthenticated) { // Or more specific role check if needed here
    return <>{children}</>;
  }

  return null; // Or a loader, effectively handled by useEffect redirect
}