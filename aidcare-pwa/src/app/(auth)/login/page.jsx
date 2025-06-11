// src/app/(auth)/login/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext'; // Adjust path

// Mock API URL - replace with your actual backend URL when ready
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// Placeholder for your actual API call function
async function loginUserApi(email, password) {
  // In a real app, this would make a fetch request to your backend
  // For now, we mock it.
  console.log("Attempting login for:", email);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // --- MOCK API RESPONSE ---
  // Replace this with actual fetch to `${FASTAPI_URL}/auth/login`
  if (email === "doctor@aidcare.com" && password === "password") {
    return {
      access_token: "mock_doctor_jwt_token_string",
      token_type: "bearer",
      user: { 
        id: "doc123", 
        email: "doctor@aidcare.com", 
        role: "doctor", 
        organization_id: "org789",
        fullName: "Dr. Ada Lovelace" 
      }
    };
  } else if (email === "chw@aidcare.com" && password === "password") {
    return {
      access_token: "mock_chw_jwt_token_string",
      token_type: "bearer",
      user: { 
        id: "chw456", 
        email: "chw@aidcare.com", 
        role: "chw", 
        organization_id: "org789",
        fullName: "Mr. Charles Babbage"
      }
    };
  } else {
    throw new Error("Incorrect email or password (mock error)");
  }
  // --- END MOCK API RESPONSE ---
}


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isLoading for clarity
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAuthDispatch();
  const { isAuthenticated, isLoading: authIsLoading } = useAuthState(); // Get auth loading state

  const messageFromSignup = searchParams.get('message'); // For messages from signup page

  // Redirect if already authenticated
  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      console.log("User already authenticated, redirecting from login...");
      router.replace('/dashboard'); // Or role-specific dashboard
    }
  }, [isAuthenticated, authIsLoading, router]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    dispatch({ type: 'LOGIN_REQUEST' });

    try {
      // const response = await fetch(`${FASTAPI_URL}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.detail || 'Login failed');
      
      // Using mocked API call for now:
      const data = await loginUserApi(email, password);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token: data.access_token, user: data.user } });
      
      // Persist token and user info (simple localStorage example)
      localStorage.setItem('aidcareAuthToken', data.access_token);
      localStorage.setItem('aidcareUser', JSON.stringify(data.user));

      // Redirect based on role (example) - adapt to your actual dashboard routes
      const role = data.user?.role;
      if (role === 'org_admin') router.push('/organization/dashboard'); // Create these pages later
      else if (role === 'doctor') router.push('/doctor/dashboard'); // Create these pages later
      else if (role === 'chw') router.push('/chw/dashboard');       // Create these pages later
      else router.push('/dashboard'); // Generic dashboard
      
    } catch (err) {
      setError(err.message);
      dispatch({ type: 'LOGIN_FAILURE' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authIsLoading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><p>Loading...</p></div>; // Or your LoadingSpinner
  }
  if (isAuthenticated) { // Should be caught by useEffect, but as a fallback
      return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><p>Redirecting...</p></div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '30px 40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', marginBottom: '25px', color: '#555' }}>Log in to your AidCare account.</p>
        
        {messageFromSignup && <p style={{color: 'green', textAlign: 'center', marginBottom: '15px', background: '#e6ffed', border: '1px solid #b7ebc3', padding: '10px', borderRadius: '4px'}}>{messageFromSignup}</p>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="email" style={labelStyle}>Email address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com" />
          </div>
          <div style={{marginBottom: '20px'}}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
            {/* Add show/hide password toggle functionality here later */}
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9em'}}>
          <Link href="/forgot-password" style={{color: '#007bff', textDecoration: 'none'}}>Forgot your password?</Link>
          <p style={{marginTop: '15px', color: '#555'}}>
            Don't have an account? <Link href="/signup" style={{color: '#007bff', fontWeight: '500', textDecoration: 'none'}}>Sign up</Link>
          </p>
        </div>
         <p style={{fontSize: '0.75em', color: '#888', textAlign: 'center', marginTop: '40px'}}>
            By continuing, you agree to AidCare's <Link href="/terms" style={{color: '#555'}}>Terms of Use</Link> and <Link href="/privacy" style={{color: '#555'}}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

// Basic styles (can move to CSS Modules)
const labelStyle = {display: 'block', marginBottom: '5px', fontWeight: '500', color: '#444'};
const inputStyle = {width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1em'};
const buttonStyle = {width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', fontWeight: '500'};