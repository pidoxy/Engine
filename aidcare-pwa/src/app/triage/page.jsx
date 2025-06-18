// src/app/triage/page.js
"use client"; // <--- IMPORTANT: This page needs client-side interactivity

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import AudioRecorder from '../components/AudioRecorder';
import RecommendationDisplay from '../components/RecommendationDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { patientService } from '../lib/services';
// import styles from './TriagePage.module.css'; // Create if you want specific styles

export default function TriagePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualContext, setManualContext] = useState('');
  const [currentPatientUuid, setCurrentPatientUuid] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

  // Fetch patients for selection
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await patientService.getOrganizationPatients();
      setPatients(response.data || response || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setErrorMessage('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patientUuid) => {
    setCurrentPatientUuid(patientUuid);
    const patient = patients.find(p => p.patient_uuid === patientUuid);
    setSelectedPatient(patient);
    setTriageResult(null);
    setErrorMessage('');
  };

  const handleRecordingStart = useCallback(() => {
    console.log("Parent: Recording started...");
    setIsRecording(true);
    setAudioBlob(null);
    setTriageResult(null);
    setErrorMessage('');
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    console.log("Parent: Recording stopped. Blob received:", blob);
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
    } else {
      setErrorMessage("Recording failed or no audio data was captured. Please try again.");
      setAudioBlob(null);
    }
  }, []);

  const processAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess) {
      setErrorMessage('No audio recorded to process.');
      return;
    }
    if (!currentPatientUuid) {
      setErrorMessage('Please select a patient first.');
      return;
    }

    console.log("Parent: Processing audio blob for patient:", currentPatientUuid);
    setIsLoading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `triage_recording_${Date.now()}.wav`);
    formData.append('manual_context', manualContext);

    try {
      const response = await fetch(`${FASTAPI_URL}/triage/process_audio/${currentPatientUuid}`, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      console.log("API Success Response:", responseData);
      setTriageResult(responseData);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error processing audio:', error);
      setErrorMessage(error.message || 'An unknown error occurred during processing.');
      setTriageResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [FASTAPI_URL, currentPatientUuid, manualContext]);

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading) {
      processAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processAudio]);

  const startNewTriage = () => {
    setAudioBlob(null);
    setTriageResult(null);
    setErrorMessage('');
    setIsRecording(false);
    setManualContext('');
  };

  if (!user) {
    return <div>Please log in to access triage.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>CHW Triage System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.first_name || user.username}</span>
          <button 
            onClick={() => router.push('/dashboard/chw')}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
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
        </header>

      <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Patient Selection */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Patient Selection</h3>
          {loadingPatients ? (
            <div>Loading patients...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select
                value={currentPatientUuid}
                onChange={(e) => handlePatientSelect(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  width: '100%'
                }}
                disabled={isLoading || isRecording}
              >
                <option value="">Select a patient...</option>
                {patients.map(patient => (
                  <option key={patient.patient_uuid} value={patient.patient_uuid}>
                    {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || `Patient ${patient.patient_uuid.slice(0, 8)}`}
                    {patient.date_of_birth && ` (DOB: ${new Date(patient.date_of_birth).toLocaleDateString()})`}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => router.push('/patients/create')}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start'
                }}
              >
                Create New Patient
              </button>
            </div>
          )}
        </div>

        {/* Patient Context Display */}
        {selectedPatient && (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Patient Context</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Name:</strong> {selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
              </div>
              {selectedPatient.date_of_birth && (
                <div>
                  <strong>DOB:</strong> {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                </div>
              )}
              {selectedPatient.gender && (
                <div>
                  <strong>Gender:</strong> {selectedPatient.gender}
                </div>
              )}
            </div>
            
            {selectedPatient.medical_history && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Medical History:</strong>
                <div style={{ background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {selectedPatient.medical_history}
                </div>
              </div>
            )}
            
            {selectedPatient.allergies && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Allergies:</strong>
                <div style={{ background: '#fff3cd', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', border: '1px solid #ffeaa7' }}>
                  {selectedPatient.allergies}
                </div>
              </div>
            )}
            
            {selectedPatient.current_medications && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Current Medications:</strong>
                <div style={{ background: '#e7f3ff', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {selectedPatient.current_medications}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Context Input */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Additional Context (Optional)</h4>
          <textarea
            value={manualContext}
            onChange={(e) => setManualContext(e.target.value)}
            placeholder="Add any additional context about the patient's current condition, observations, or relevant information..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
            disabled={isLoading || isRecording}
          />
        </div>

        {/* Audio Recording */}
        <section style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Record Patient Consultation</h4>
          {!currentPatientUuid ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Please select a patient above to begin triage recording.
            </div>
          ) : (
          <AudioRecorder
            onRecordingStart={handleRecordingStart}
            onRecordingStop={handleRecordingStop}
            isRecording={isRecording}
            disabled={isLoading}
          />
          )}
        </section>

        {isLoading && <LoadingSpinner />}
        {errorMessage && <ErrorMessage message={errorMessage} />}
        
        {triageResult && (
          <div>
            <RecommendationDisplay result={triageResult} />
            
            {/* Patient Context Used Display */}
            {triageResult.patient_context_used && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                marginTop: '1rem',
                border: '1px solid #e3f2fd'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Patient Context Used in Triage</h4>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  <div>✓ Medical History: {triageResult.patient_context_used.has_medical_history ? 'Available' : 'Not available'}</div>
                  <div>✓ Allergies: {triageResult.patient_context_used.has_allergies ? 'Available' : 'Not available'}</div>
                  <div>✓ Current Medications: {triageResult.patient_context_used.has_current_medications ? 'Available' : 'Not available'}</div>
                  <div>✓ Historical Documents: {triageResult.patient_context_used.historical_documents_count} document(s) used</div>
                </div>
              </div>
            )}
          </div>
        )}

        {(triageResult || errorMessage) && !isLoading && (
          <button 
            onClick={startNewTriage} 
            style={{ 
              marginTop: '20px', 
              padding: '12px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Start New Triage Session
          </button>
        )}
      </main>
    </div>
  );
}

// You can export metadata for static rendering if needed, but for dynamic titles
// based on state, it's more complex with App Router Server Components.
// export const metadata = {
//   title: 'AidCare - Triage Session',
// };