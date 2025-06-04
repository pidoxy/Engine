"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FaStethoscope, FaMicrophone, FaArrowLeft, FaHeart, FaUserMd, FaClipboardList, FaBrain } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety, MdSupport } from 'react-icons/md';

import AudioRecorder from '../../components/AudioRecorder'; // Path relative to app directory
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import PotentialConditionsDisplay from '../../components/PotentialConditionsDisplay';
import SuggestedInvestigationsDisplay from '../../components/SuggestedInvestigationsDisplay';
import MedicationConsiderationsDisplay from '../../components/MedicationConsiderationsDisplay';
import AlertsFlagsDisplay from '../../components/AlertsFlagsDisplay';
import SummaryDisplay from '../../components/SummaryDisplay';

export default function ClinicalSupportPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null); // Stores the full API response
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [manualContext, setManualContext] = useState('');
  const [currentPatientUuid, setCurrentPatientUuid] = useState("test-patient-123");

  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
  const processingInitiatedRef = useRef(false);

  const handleRecordingStart = useCallback(() => {
    console.log("Clinical Page: Recording started...");
    setIsRecording(true);
    setAudioBlob(null);
    setApiResult(null);
    setErrorMessage('');
    setLoadingComplete(false);
    setManualContext(''); // clear manual context when new audio recording starts
    processingInitiatedRef.current = false;
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
      processingInitiatedRef.current = false;
    } else {
      setErrorMessage("Recording failed or no audio data was captured.");
      setAudioBlob(null);
      processingInitiatedRef.current = false;
    }
  }, []);

  const processConsultationAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess) {
      setErrorMessage('No audio recorded to process.');
      processingInitiatedRef.current = false;
      return;
    }
    if (!currentPatientUuid) {
      setErrorMessage('Patient UUID is missing.');
      return;
    }

    setIsLoading(true);
    setLoadingComplete(false);
    setErrorMessage('');
    // setApiResult(null); // clear previous results before new api call

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `consult_recording_${Date.now()}.webm`); // Using webm as per recorder
    formData.append('manual_context', manualContext);

    const apiUrl = `${FASTAPI_URL}/clinical_support/process_consultation/`;
    console.log("Frontend: Attempting to POST to URL:", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }
      console.log("API Success Response (Clinical Support):", responseData);
      
      // Signal that the loading is complete
      setLoadingComplete(true);
      
      // Small delay to show the completion animation
      setTimeout(() => {
        setApiResult(responseData);
        console.log("processConsultationAudio: Setting audioBlob to NULL after successful processing.");
        setAudioBlob(null);
        setIsLoading(false);
      }, 1000); // Give time for the 100% animation
      
    } catch (error) {
      console.error('Error processing consultation:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      setApiResult(null);
      setAudioBlob(null);
      setIsLoading(false);
      setLoadingComplete(false);
    }
    processingInitiatedRef.current = false;
  }, [FASTAPI_URL, manualContext, currentPatientUuid]);

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading) {
      processConsultationAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processConsultationAudio]);

  const startNewConsultation = () => {
    setAudioBlob(null);
    setApiResult(null);
    setErrorMessage('');
    setIsRecording(false);
    setIsLoading(false);
    setLoadingComplete(false);
    setManualContext('');
    processingInitiatedRef.current = false;
  };

  // Destructure for easier access in JSX, only if apiResult and details exist
  const clinicalDetails = apiResult?.clinical_support_details;

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 50%, #e8f5e8 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e2e8f0',
      padding: '1rem 0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none',
      color: '#2563eb',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: '1px solid #e2e8f0',
      background: 'white',
      transition: 'all 0.3s ease',
      fontSize: '0.875rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      color: 'white'
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    logoSubtext: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: 0
    },
    hipaaLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#059669',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    main: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem 1rem'
    },
    pageTitle: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    titleIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '4rem',
      height: '4rem',
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      borderRadius: '50%',
      marginBottom: '1rem',
      color: 'white'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem',
      margin: 0
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      margin: 0
    },
    patientSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    },
    patientSectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    patientInput: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      transition: 'border-color 0.3s ease',
      background: 'white'
    },
    patientInputFocused: {
      borderColor: '#2563eb',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
    },
    contextSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    },
    contextTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    contextSubtitle: {
      color: '#6b7280',
      marginBottom: '1.5rem',
      lineHeight: 1.6,
      fontSize: '0.875rem'
    },
    textarea: {
      width: '100%',
      padding: '1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      resize: 'vertical',
      minHeight: '100px',
      marginBottom: '1.5rem',
      transition: 'border-color 0.3s ease'
    },
    textareaFocused: {
      borderColor: '#2563eb',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
    },
    recorderSection: {
      textAlign: 'center',
      paddingTop: '1rem',
      borderTop: '1px solid #e5e7eb'
    },
    recorderTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    recorderDescription: {
      color: '#6b7280',
      marginBottom: '1.5rem',
      fontSize: '0.875rem'
    },
    contentSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    },
    resultsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    detailsSection: {
      background: '#f8fafc',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem'
    },
    detailsSummary: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1f2937',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    detailsContent: {
      marginTop: '1rem',
      maxHeight: '200px',
      overflowY: 'auto',
      background: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      fontSize: '0.875rem',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all'
    },
    newConsultButton: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      transition: 'all 0.3s ease'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '1rem'
    },
    recordingBadge: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    },
    processingBadge: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: '#2563eb',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    },
    readyBadge: {
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#059669',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link 
            href="/" 
            style={styles.backButton}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <FaArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
          
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <FaStethoscope size={24} />
            </div>
            <div>
              <h1 style={styles.logoText}>AidCare</h1>
              <p style={styles.logoSubtext}>AI Medical Assistant</p>
            </div>
          </div>
          
          <div style={styles.hipaaLabel}>
            <MdHealthAndSafety size={20} />
            <span>HIPAA Compliant</span>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Page Title */}
        <div style={styles.pageTitle}>
          <div style={styles.titleIcon}>
            <FaUserMd size={32} />
          </div>
          <h1 style={styles.title}>Clinical Support Session</h1>
          <p style={styles.subtitle}>
            AI-powered clinical decision support for medical professionals
          </p>
        </div>

        {/* Status Badge */}
        {isRecording && (
          <div style={styles.statusBadge} className="recording-badge">
            <div style={{...styles.statusBadge, ...styles.recordingBadge}}>
              <FaMicrophone size={16} />
              <span>Recording consultation...</span>
            </div>
          </div>
        )}

        {isLoading && (
          <div style={styles.statusBadge} className="processing-badge">
            <div style={{...styles.statusBadge, ...styles.processingBadge}}>
              <FaBrain size={16} />
              <span>AI analyzing clinical data...</span>
            </div>
          </div>
        )}

        {!isRecording && !isLoading && !apiResult && !errorMessage && (
          <div style={styles.statusBadge} className="ready-badge">
            <div style={{...styles.statusBadge, ...styles.readyBadge}}>
              <MdSupport size={16} />
              <span>Ready for consultation</span>
            </div>
          </div>
        )}

        {/* Patient Information Section */}
        <section style={styles.patientSection}>
          <h2 style={styles.patientSectionTitle}>
            <FaClipboardList />
            Patient Information
          </h2>
          <div>
            <label htmlFor="patientIdInput" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Patient UUID
            </label>
            <input
              id="patientIdInput"
              type="text"
              value={currentPatientUuid}
              onChange={(e) => setCurrentPatientUuid(e.target.value)}
              placeholder="Enter Patient UUID"
              style={styles.patientInput}
              disabled={isLoading || isRecording}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </section>

        {/* Context and Recording Section */}
        <section style={styles.contextSection}>
          <h2 style={styles.contextTitle}>
            <FaMicrophone />
            Clinical Context & Recording
          </h2>
          <p style={styles.contextSubtitle}>
            Provide relevant patient history and medical context, then record your clinical observations and consultation notes.
          </p>
          
          <div>
            <label htmlFor="contextTextarea" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Patient History & Manual Context (Optional)
            </label>
            <textarea
              id="contextTextarea"
              value={manualContext}
              onChange={(e) => setManualContext(e.target.value)}
              rows={4}
              placeholder="e.g., Known diabetic on metformin, Allergic to penicillin (rash), Recent travel to endemic areas, Family history of cardiac disease..."
              style={styles.textarea}
              disabled={isLoading || isRecording}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={styles.recorderSection}>
            <h3 style={styles.recorderTitle}>
              <FaMicrophone />
              Voice Recording
            </h3>
            <p style={styles.recorderDescription}>
              Record your clinical observations, patient presentation, and consultation notes
            </p>
            
            <AudioRecorder
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
              isRecording={isRecording}
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div style={styles.contentSection}>
            <LoadingSpinner onComplete={loadingComplete} />
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div style={styles.contentSection}>
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        {/* Clinical Support Results */}
        {apiResult && clinicalDetails && (
          <div style={styles.contentSection}>
            <div style={styles.resultsContainer}>
              {/* Optional debug information */}
              {apiResult.extracted_clinical_info && Object.keys(apiResult.extracted_clinical_info).length > 0 && (
                <details style={styles.detailsSection}>
                  <summary style={styles.detailsSummary}>
                    <FaBrain />
                    Extracted Clinical Information (Summary)
                  </summary>
                  <div style={styles.detailsContent}>
                    {JSON.stringify(apiResult.extracted_clinical_info, null, 2)}
                  </div>
                </details>
              )}

              <PotentialConditionsDisplay conditions={clinicalDetails.potential_conditions} />
              <SuggestedInvestigationsDisplay investigations={clinicalDetails.suggested_investigations} />
              <MedicationConsiderationsDisplay considerations={clinicalDetails.medication_considerations_info} />
              <AlertsFlagsDisplay alerts={clinicalDetails.alerts_and_flags} />
              <SummaryDisplay summary={clinicalDetails.differential_summary_for_doctor} />
            </div>
          </div>
        )}

        {/* New Consultation Button */}
        {(apiResult || errorMessage) && !isLoading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={startNewConsultation} 
              style={styles.newConsultButton}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
              }}
            >
              <MdSupport size={20} />
              <span>Start New Consultation</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}