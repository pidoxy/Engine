"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../lib/services';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getOrganizationPatients();
      setPatients(response.data || response || []);
    } catch (err) {
      setError('Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = () => {
    router.push('/patients/create');
  };

  const handleViewPatient = (patientId) => {
    router.push(`/patients/${patientId}`);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           patient.phoneNumber?.includes(searchTerm);
  });

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
          <p>Loading patients...</p>
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
          <h1 style={{ margin: 0, color: '#333' }}>Patient Records</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Manage patient information and records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ 
            padding: '0.25rem 0.75rem',
            background: user?.role === 'admin' ? '#dc3545' : user?.role === 'consultant' ? '#007bff' : '#28a745',
            color: 'white',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            {user?.role || 'User'}
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

        {/* Controls */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
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
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            + Add New Patient
          </button>
        </div>

        {/* Patients Table */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0 }}>
              All Patients ({filteredPatients.length})
            </h3>
          </div>
          
          {filteredPatients.length > 0 ? (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Patient Name
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Age
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Gender
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Phone
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Date Added
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, index) => (
                    <tr key={patient.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#333' }}>
                            {patient.firstName} {patient.lastName}
                          </div>
                          {patient.emergencyContact && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                              Emergency: {patient.emergencyContact}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#555' }}>
                        {calculateAge(patient.dateOfBirth)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: patient.gender === 'male' ? '#e3f2fd' : patient.gender === 'female' ? '#fce4ec' : '#f3e5f5',
                          color: patient.gender === 'male' ? '#1976d2' : patient.gender === 'female' ? '#c2185b' : '#7b1fa2',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}>
                          {patient.gender || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#555' }}>
                        {patient.phoneNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', color: '#555' }}>
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            View
                          </button>
                          
                          {user?.role !== 'admin' && (
                            <button
                              onClick={() => router.push(
                                user?.role === 'chw' 
                                  ? `/triage?patient=${patient.id}` 
                                  : `/doctor/consult?patient=${patient.id}`
                              )}
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
                              {user?.role === 'chw' ? 'Triage' : 'Consult'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              {searchTerm ? (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h4 style={{ margin: '0 0 1rem 0' }}>No patients found</h4>
                  <p style={{ marginBottom: '1.5rem' }}>
                    No patients match your search for "{searchTerm}". Try a different search term.
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '1rem'
                    }}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h4 style={{ margin: '0 0 1rem 0' }}>No Patients Yet</h4>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Start by adding your first patient to the system.
                  </p>
                </>
              )}
              
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
                Add First Patient
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {filteredPatients.length > 0 && (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            marginTop: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ← Back to Dashboard
              </button>
              
              {user?.role !== 'admin' && (
                <button
                  onClick={() => router.push(user?.role === 'chw' ? '/triage' : '/doctor/consult')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {user?.role === 'chw' ? 'Start Triage' : 'Clinical Support'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 