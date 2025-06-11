// src/app/(auth)/signup/page.js
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // For App Router
import { useAuthDispatch } from '../../context/AuthContext'; // Adjust path
import Link from 'next/link';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export default function SignupPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const dispatch = useAuthDispatch(); // Not logging in directly on org signup usually

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${FASTAPI_URL}/auth/signup/organization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName, email, firstName, lastName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Signup failed');
      
      console.log("Organization signup successful:", data);
      // Typically redirect to login or a "check your email for admin setup" page
      router.push('/login?message=Organization created. Please log in as admin.'); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic form resembling your mockup
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '400px' }}>
        <h2>Welcome to AidCare</h2>
        <p>Create an organization account</p>
        <form onSubmit={handleSubmit}>
          {/* Organization Name, Email, First Name, Last Name, Password inputs */}
          {/* Example for one field: */}
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="orgName">Organization Name</label>
            <input type="text" id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="email">Admin Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          {/* Add First Name, Last Name, Password inputs similarly */}
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="firstName">Your First Name</label>
            <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="lastName">Your Last Name</label>
            <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {isLoading ? 'Creating Account...' : 'Create an account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link href="/login" style={{color: '#007bff'}}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
const inputStyle = {width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box'};
const buttonStyle = {width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em'};