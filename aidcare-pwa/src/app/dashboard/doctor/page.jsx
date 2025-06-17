"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService, organizationService } from '../../lib/services';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization patients
      const patientsResponse = await patientService.getOrganizationPatients();
      setPatients(patientsResponse.data || patientsResponse || []);

      // Fetch organization details if user has organization
      if (user?.organization) {
        try {
          const orgResponse = await organizationService.getOrganizationById(user.organization);
          setOrganization(orgResponse.data || orgResponse);
        } catch (orgError) {
          console.log('Could not fetch organization details:', orgError);
        }
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = () => {
    router.push('/patients/create');
  };

  const handleStartConsultation = () => {
    router.push('/doctor/consult');
  };

  const handleViewPatient = (patientId) => {
    router.push(`/patients/${patientId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading doctor dashboard...</p>
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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Doctor Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Dr. {user?.firstName} {user?.lastName}
          </p>
          {organization && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>
              {organization.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ 
            padding: '0.25rem 0.75rem',
            background: '#007bff',
            color: 'white',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            {user?.role || 'Doctor'}
          </span>
          <button 
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>My Patients</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{patients.length}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Today's Consultations</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>0</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>Pending Reviews</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>0</p>
          </div>
        </div>

        {/* Clinical Tools */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Clinical Tools</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <button
              onClick={handleStartConsultation}
              style={{
                padding: '1.5rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🩺</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>AI Clinical Support</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Get AI-powered clinical decision support</div>
            </button>
            
            <button
              onClick={handleCreatePatient}
              style={{
                padding: '1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>New Patient</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Register a new patient</div>
            </button>

            <button
              onClick={() => router.push('/patients')}
              style={{
                padding: '1.5rem',
                background: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Patient Records</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>View all patient records</div>
            </button>
          </div>
        </div>

        {/* Recent Patients */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Patients</h3>
            <button
              onClick={() => router.push('/patients')}
              style={{
                padding: '0.5rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              View All
            </button>
          </div>
          
          {patients.length > 0 ? (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Patient Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Age</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Gender</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Last Visit</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 5).map((patient, index) => (
                    <tr key={patient.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '500' }}>{patient.firstName} {patient.lastName}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {patient.dateOfBirth ? 
                          Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{patient.gender || 'N/A'}</td>
                      <td style={{ padding: '0.75rem' }}>N/A</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => handleViewPatient(patient.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            marginRight: '0.5rem'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/doctor/consult?patient=${patient.id}`)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Consult
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <h4 style={{ margin: '0 0 1rem 0' }}>No Patients Yet</h4>
              <p style={{ marginBottom: '1.5rem' }}>Start by registering your first patient to begin providing care.</p>
              <button
                onClick={handleCreatePatient}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Register First Patient
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 