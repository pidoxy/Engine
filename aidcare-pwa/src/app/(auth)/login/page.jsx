// src/app/(auth)/login/page.js
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authIsLoading, login } = useAuth();

  const messageFromSignup = searchParams.get('message');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      console.log("User already authenticated, redirecting from login...");
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authIsLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await login({ email, password });
      
      // Redirect based on role
      const user = response.data?.user || response.data?.data?.user;
      const role = user?.role;
      
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'consultant' || role === 'doctor') {
        router.push('/dashboard/doctor');
      } else if (role === 'chw') {
        router.push('/dashboard/chw');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authIsLoading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{marginBottom: '20px'}}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '30px 40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', marginBottom: '25px', color: '#555' }}>Log in to your AidCare account.</p>
        
        {messageFromSignup && (
          <p style={{
            color: 'green', 
            textAlign: 'center', 
            marginBottom: '15px', 
            background: '#e6ffed', 
            border: '1px solid #b7ebc3', 
            padding: '10px', 
            borderRadius: '4px'
          }}>
            {messageFromSignup}
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="email" style={labelStyle}>Email address</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>
          <div style={{marginBottom: '20px'}}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>
          {error && (
            <p style={{ 
              color: '#dc3545', 
              textAlign: 'center', 
              marginBottom: '15px',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>
              {error}
            </p>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{
              ...buttonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9em'}}>
          <Link href="/forgot-password" style={{color: '#007bff', textDecoration: 'none'}}>
            Forgot your password?
          </Link>
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

// Basic styles
const labelStyle = {display: 'block', marginBottom: '5px', fontWeight: '500', color: '#444'};
const inputStyle = {
  width: '100%', 
  padding: '10px', 
  borderRadius: '4px', 
  border: '1px solid #ccc', 
  boxSizing: 'border-box', 
  fontSize: '1em',
  transition: 'border-color 0.2s ease'
};
const buttonStyle = {
  width: '100%', 
  padding: '12px', 
  background: '#007bff', 
  color: 'white', 
  border: 'none', 
  borderRadius: '4px', 
  fontSize: '1em', 
  fontWeight: '500',
  transition: 'background-color 0.2s ease'
};