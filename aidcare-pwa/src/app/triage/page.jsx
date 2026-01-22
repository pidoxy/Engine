// src/app/triage/page.js
"use client"; // <--- IMPORTANT: This page needs client-side interactivity

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head'; // Still useful for setting page-specific titles/meta if needed
import AudioRecorder from '../components/AudioRecorder';
import TriageResults from '../components/triage/TriageResults';
import TriageForm from '../components/triage/TriageForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Link from 'next/link';
import { FaStethoscope, FaMicrophone, FaArrowLeft, FaHeart, FaKeyboard } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
// import styles from './TriagePage.module.css'; // Create if you want specific styles

// Move FASTAPI_URL outside component to prevent recreation
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export default function TriagePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'

  // Use ref to track if we've already processed this blob
  const processedBlobRef = useRef(null);

  const handleRecordingStart = useCallback(() => {
    console.log("Parent: Recording started...");
    setIsRecording(true);
    setAudioBlob(null);
    setTriageResult(null);
    setErrorMessage('');
    setLoadingComplete(false);
    processedBlobRef.current = null; // Reset processed blob reference
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    console.log("Parent: Recording stopped. Blob received:", blob);
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
      processedBlobRef.current = null; // Reset to allow processing of new blob
    } else {
      setErrorMessage("Recording failed or no audio data was captured. Please try again.");
      setAudioBlob(null); // Ensure no stale blob
    }
  }, []);

  const processAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess) {
      setErrorMessage('No audio recorded to process.');
      return;
    }

    // Prevent processing the same blob multiple times
    if (processedBlobRef.current === blobToProcess) {
      console.log("Blob already processed, skipping...");
      return;
    }

    console.log("Parent: Processing audio blob:", blobToProcess);
    processedBlobRef.current = blobToProcess; // Mark this blob as being processed
    setIsLoading(true);
    setLoadingComplete(false);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `triage_recording_${Date.now()}.wav`);

    try {
      const response = await fetch(`${FASTAPI_URL}/triage/process_audio/`, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }

      console.log("API Success Response:", responseData);

      // Signal that the loading is complete
      setLoadingComplete(true);

      // Small delay to show the completion animation
      setTimeout(() => {
        setTriageResult(responseData);
        setAudioBlob(null); // <--- Clear the blob after successful processing
        setIsLoading(false);
      }, 1000); // Give time for the 100% animation

    } catch (error) {
      console.error('Error processing audio:', error);
      setErrorMessage(error.message || 'An unknown error occurred during processing.');
      setTriageResult(null);
      processedBlobRef.current = null; // Reset on error to allow retry
      setIsLoading(false);
      setLoadingComplete(false);
    }
  }, []); // Remove FASTAPI_URL from dependencies since it's now constant

  const processText = useCallback(async (textData) => {
    if (!textData || !textData.symptoms) {
      setErrorMessage('Please enter symptoms before submitting.');
      return;
    }

    console.log("Parent: Processing text input:", textData);
    setIsLoading(true);
    setLoadingComplete(false);
    setErrorMessage('');

    try {
      const response = await fetch(`${FASTAPI_URL}/triage/process_text/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: textData.symptoms
        }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }

      console.log("API Success Response:", responseData);

      // Signal that the loading is complete
      setLoadingComplete(true);

      // Small delay to show the completion animation
      setTimeout(() => {
        setTriageResult(responseData);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error processing text:', error);
      setErrorMessage(error.message || 'An unknown error occurred during processing.');
      setTriageResult(null);
      setIsLoading(false);
      setLoadingComplete(false);
    }
  }, []);

  // Separate useEffect with better dependency management
  useEffect(() => {
    // Only process if we have a new audioBlob that hasn't been processed yet
    if (audioBlob && !isRecording && !isLoading && processedBlobRef.current !== audioBlob) {
      processAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processAudio]);

  const startNewTriage = () => {
    setAudioBlob(null);
    setTriageResult(null);
    setErrorMessage('');
    setIsRecording(false);
    setLoadingComplete(false);
    processedBlobRef.current = null; // Reset processed blob reference
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'voice' ? 'text' : 'voice');
    startNewTriage(); // Reset when switching modes
  };

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
      maxWidth: '900px',
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
    recorderSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem',
      textAlign: 'center'
    },
    recorderTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    recorderDescription: {
      color: '#6b7280',
      marginBottom: '1.5rem',
      lineHeight: 1.6
    },
    contentSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    },
    newTriageButton: {
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
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
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
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
            <MdLocalHospital size={32} />
          </div>
          <h1 style={styles.title}>AI Triage Session</h1>
          <p style={styles.subtitle}>
            Speak clearly about the patient's symptoms and medical concerns
          </p>
        </div>

        {/* Status Badge */}
        {isRecording && (
          <div style={styles.statusBadge} className="recording-badge">
            <div style={{...styles.statusBadge, ...styles.recordingBadge}}>
              <FaMicrophone size={16} />
              <span>Recording in progress...</span>
            </div>
          </div>
        )}

        {isLoading && (
          <div style={styles.statusBadge} className="processing-badge">
            <div style={{...styles.statusBadge, ...styles.processingBadge}}>
              <FaHeart size={16} />
              <span>AI analyzing symptoms...</span>
            </div>
          </div>
        )}

        {!isRecording && !isLoading && !triageResult && !errorMessage && (
          <div style={styles.statusBadge} className="ready-badge">
            <div style={{...styles.statusBadge, ...styles.readyBadge}}>
              <FaStethoscope size={16} />
              <span>Ready for new recording</span>
            </div>
          </div>
        )}

        {/* Input Mode Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'white',
            borderRadius: '9999px',
            padding: '0.25rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setInputMode('voice')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                background: inputMode === 'voice' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: inputMode === 'voice' ? 'white' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <FaMicrophone size={14} />
              Voice Input
            </button>
            <button
              onClick={() => setInputMode('text')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                background: inputMode === 'text' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: inputMode === 'text' ? 'white' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <FaKeyboard size={14} />
              Text Input
            </button>
          </div>
        </div>

        {/* Audio Recorder or Text Form Section */}
        {inputMode === 'voice' ? (
          <section style={styles.recorderSection}>
            <h2 style={styles.recorderTitle}>
              <FaMicrophone />
              Voice Recorder
            </h2>
            <p style={styles.recorderDescription}>
              Click the record button and describe the patient's symptoms, medical history,
              and any immediate concerns. Speak clearly and provide as much relevant detail as possible.
            </p>

            <AudioRecorder
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
              isRecording={isRecording}
              disabled={isLoading}
            />
          </section>
        ) : (
          <section style={styles.recorderSection}>
            <h2 style={styles.recorderTitle}>
              <FaKeyboard />
              Manual Entry
            </h2>
            <p style={styles.recorderDescription}>
              Enter the patient's symptoms and medical concerns in the text field below.
            </p>

            <TriageForm onSubmit={processText} />
          </section>
        )}

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
        
        {/* Triage Results */}
        {triageResult && (
          <div style={{ marginTop: '2rem' }}>
            <TriageResults result={triageResult} onStartNew={startNewTriage} />
          </div>
        )}

        {/* New Triage Button */}
        {(triageResult || errorMessage) && !isLoading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={startNewTriage} 
              style={styles.newTriageButton}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }}
            >
              <MdLocalHospital size={20} />
              <span>Start New Triage Session</span>
            </button>
          </div>
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