// src/app/dashboard/page.js
"use client"; // Needs to be client component to use context and router for logout

import React from 'react';
import { useAuthState, useAuthDispatch } from '../context/AuthContext'; // Adjust path
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthState();
  const dispatch = useAuthDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('aidcareAuthToken');
    localStorage.removeItem('aidcareUser');
    router.push('/login'); // Redirect to login after logout
  };

  if (!isAuthenticated) {
    // This should ideally be handled by a ProtectedRoute HOC wrapping this page's layout
    // For now, a simple conditional render or redirect.
    // useEffect(() => { router.replace('/login'); }, [router]); // Could cause hydration issues if server rendered differently
    return <p>Redirecting to login...</p>; // Or a loader while redirecting
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to Your Dashboard, {user?.fullName || user?.email}!</h1>
      <p>You are logged in as a: {user?.role}</p>
      <p>Your Organization ID: {user?.organization_id}</p>
      <p>Your User ID: {user?.id}</p>
      <button onClick={handleLogout} style={{padding: '10px 15px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
        Log Out
      </button>
      {/* Add links to other parts of the app based on role */}
      {user?.role === 'doctor' && <p><a href="/doctor/consult">Go to Clinical Consultation</a></p>}
      {user?.role === 'chw' && <p><a href="/triage">Go to CHW Triage</a></p>}

    </div>
  );
}