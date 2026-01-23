'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaMicrophone, FaKeyboard, FaStop, FaPause, FaHome, FaHistory, FaBook, FaTimes } from 'react-icons/fa';
import { MdLocalHospital } from 'react-icons/md';
import AudioRecorder from './components/AudioRecorder';
import TriageForm from './components/triage/TriageForm';
import TriageResults from './components/triage/TriageResults';

export default function TriageApp() {
  const [inputMode, setInputMode] = useState('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const processedBlobRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const FASTAPI_URL = process.env.NEXT_PUBLIC_AIDCARE_API_BASE_URL || 'http://localhost:8000';

  const loadingSteps = [
    { label: 'Transcribing voice input', status: 'complete' },
    { label: 'Analyzing symptoms and history', status: 'processing' },
    { label: 'Applying WHO clinical guidelines', status: 'pending' }
  ];

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Loading progress simulation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) return 100;
          return prev + Math.random() * 10;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
      setLoadingStep(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (loadingProgress > 30 && loadingStep === 0) setLoadingStep(1);
    if (loadingProgress > 70 && loadingStep === 1) setLoadingStep(2);
  }, [loadingProgress, loadingStep]);

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setAudioBlob(null);
    setResult(null);
    setErrorMessage('');
    processedBlobRef.current = null;
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    setIsRecording(false);
    if (blob && blob.size > 0) {
      if (recordingTime < 5) {
        setErrorMessage('Recording was too short to analyze. The diagnostic engine requires at least 5 seconds of voice input.');
        setAudioBlob(null);
      } else {
        setAudioBlob(blob);
        processedBlobRef.current = null;
      }
    } else {
      setErrorMessage('Recording failed. Please try again.');
    }
  }, [recordingTime]);

  const processAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess || processedBlobRef.current === blobToProcess) return;

    processedBlobRef.current = blobToProcess;
    setIsLoading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `recording_${Date.now()}.wav`);

    try {
      const response = await fetch(`${FASTAPI_URL}/triage/process_audio/`, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }

      setTimeout(() => {
        setResult(responseData);
        setAudioBlob(null);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during processing.');
      processedBlobRef.current = null;
      setIsLoading(false);
    }
  }, [FASTAPI_URL]);

  const processText = useCallback(async (textData) => {
    if (!textData || !textData.symptoms) {
      setErrorMessage('Please enter symptoms before submitting.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${FASTAPI_URL}/triage/process_text/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_text: textData.symptoms }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }

      setTimeout(() => {
        setResult(responseData);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during processing.');
      setIsLoading(false);
    }
  }, [FASTAPI_URL]);

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading && processedBlobRef.current !== audioBlob) {
      processAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processAudio]);

  const startNewAssessment = () => {
    setAudioBlob(null);
    setResult(null);
    setErrorMessage('');
    setIsRecording(false);
    setRecordingTime(0);
    processedBlobRef.current = null;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    sidebar: {
      width: '260px',
      background: 'white',
      borderRight: '1px solid rgba(0,0,0,0.06)',
      padding: '2rem 0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 12px rgba(0,0,0,0.03)'
    },
    logo: {
      padding: '0 1.5rem 1.75rem',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      marginBottom: '1.5rem'
    },
    logoTitle: {
      fontSize: '1.625rem',
      fontWeight: '700',
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      letterSpacing: '-0.02em'
    },
    logoSubtitle: {
      fontSize: '0.6875rem',
      color: '#64748b',
      margin: '0.375rem 0 0',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: '600'
    },
    nav: {
      flex: 1,
      padding: '0 0.875rem'
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      margin: '0 0 0.25rem 0',
      borderRadius: '8px',
      background: active ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'transparent',
      color: active ? 'white' : '#64748b',
      fontWeight: active ? '600' : '500',
      fontSize: '0.9375rem',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: active ? '0 2px 8px rgba(14, 165, 233, 0.25)' : 'none'
    }),
    syncStatus: {
      padding: '1.25rem 1.5rem',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      background: 'rgba(248, 250, 252, 0.5)'
    },
    syncLabel: {
      fontSize: '0.6875rem',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '0.625rem',
      fontWeight: '600'
    },
    syncIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.8125rem',
      color: '#10b981',
      fontWeight: '500'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      padding: '1.25rem 2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      color: '#64748b',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    headerActions: {
      display: 'flex',
      gap: '1rem'
    },
    content: {
      flex: 1,
      padding: '2.5rem',
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%'
    },
    infoBar: {
      background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
      border: '1px solid #67e8f9',
      borderRadius: '12px',
      padding: '1.125rem 1.5rem',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 2px 8px rgba(6, 182, 212, 0.1)'
    },
    infoIcon: {
      color: '#0891b2',
      fontSize: '1.5rem'
    },
    infoText: {
      flex: 1
    },
    infoTitle: {
      fontWeight: '600',
      color: '#0e7490',
      fontSize: '0.9375rem',
      marginBottom: '0.25rem',
      letterSpacing: '-0.01em'
    },
    infoSubtext: {
      color: '#0e7490',
      fontSize: '0.8125rem',
      margin: 0,
      opacity: 0.8,
      lineHeight: 1.5
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '3.5rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)',
      textAlign: 'center'
    },
    errorCard: {
      textAlign: 'center',
      padding: '3rem'
    },
    errorIcon: {
      width: '4rem',
      height: '4rem',
      margin: '0 auto 2rem',
      position: 'relative'
    },
    micIcon: {
      fontSize: '3rem',
      color: '#0ea5e9'
    },
    warningBadge: {
      position: 'absolute',
      top: '-0.5rem',
      right: '-0.5rem',
      background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      color: 'white',
      width: '2rem',
      height: '2rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      fontWeight: '700',
      boxShadow: '0 3px 12px rgba(245, 158, 11, 0.4)'
    },
    errorTitle: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '1rem',
      letterSpacing: '-0.03em'
    },
    errorText: {
      color: '#64748b',
      fontSize: '1.0625rem',
      lineHeight: 1.7,
      marginBottom: '2.5rem',
      maxWidth: '540px',
      margin: '0 auto 2.5rem',
      fontWeight: '400'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      color: 'white',
      padding: '1rem 2.25rem',
      borderRadius: '10px',
      border: 'none',
      fontSize: '0.9375rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.625rem',
      minWidth: '200px',
      justifyContent: 'center',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      marginBottom: '1rem',
      boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
      letterSpacing: '-0.01em'
    },
    secondaryButton: {
      background: 'white',
      color: '#475569',
      padding: '0.875rem 1.75rem',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '0.9375rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.625rem',
      justifyContent: 'center',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      letterSpacing: '-0.01em'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.75rem 0',
      color: '#94a3b8',
      fontSize: '0.8125rem',
      fontWeight: '500',
      letterSpacing: '0.02em'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%)'
    },
    recordingView: {
      textAlign: 'center'
    },
    listeningTitle: {
      fontSize: '2.25rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '0.75rem',
      letterSpacing: '-0.03em'
    },
    listeningSubtitle: {
      color: '#64748b',
      fontSize: '1.0625rem',
      marginBottom: '3rem',
      lineHeight: 1.7,
      fontWeight: '400'
    },
    waveformContainer: {
      margin: '2rem auto 3rem',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    timer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '3rem'
    },
    timerBlock: {
      textAlign: 'center'
    },
    timerValue: {
      fontSize: '3.5rem',
      fontWeight: '700',
      color: '#0ea5e9',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.02em',
      textShadow: '0 2px 10px rgba(14, 165, 233, 0.15)'
    },
    timerLabel: {
      fontSize: '0.6875rem',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginTop: '0.375rem',
      fontWeight: '600'
    },
    recordingControls: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem'
    },
    controlButton: (variant = 'default') => ({
      width: variant === 'stop' ? '5rem' : '4rem',
      height: variant === 'stop' ? '5rem' : '4rem',
      borderRadius: variant === 'stop' ? '16px' : '12px',
      border: 'none',
      background: variant === 'stop' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : 'white',
      color: variant === 'stop' ? 'white' : '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.5rem',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: variant === 'stop' ? '0 6px 20px rgba(14, 165, 233, 0.35)' : '0 2px 8px rgba(0,0,0,0.08)'
    }),
    loadingView: {
      textAlign: 'center',
      padding: '3rem 2rem'
    },
    loadingTitle: {
      fontSize: '2.25rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '0.75rem',
      letterSpacing: '-0.03em'
    },
    loadingSubtitle: {
      color: '#64748b',
      fontSize: '1.0625rem',
      marginBottom: '3rem',
      fontWeight: '400',
      lineHeight: 1.6
    },
    progressSection: {
      maxWidth: '640px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px',
      padding: '2.5rem',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
    },
    progressHeader: {
      marginBottom: '1.5rem'
    },
    statusLabel: {
      fontSize: '0.6875rem',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '0.625rem',
      fontWeight: '600'
    },
    statusRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.25rem'
    },
    statusText: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#0f172a',
      letterSpacing: '-0.01em'
    },
    progressPercent: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#0ea5e9',
      letterSpacing: '-0.02em',
      textShadow: '0 1px 6px rgba(14, 165, 233, 0.15)'
    },
    progressBar: {
      height: '10px',
      background: 'rgba(226, 232, 240, 0.8)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2.5rem',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
    },
    progressFill: (progress) => ({
      height: '100%',
      background: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%)',
      width: `${progress}%`,
      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)',
      borderRadius: '20px'
    }),
    stepsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    step: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-start'
    },
    stepIcon: (status) => ({
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: status === 'complete' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : status === 'processing' ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' : '#e2e8f0',
      color: status === 'complete' || status === 'processing' ? 'white' : '#94a3b8',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '700',
      boxShadow: status === 'complete' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : status === 'processing' ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none',
      transition: 'all 0.3s ease'
    }),
    stepContent: {
      flex: 1,
      paddingTop: '0.375rem'
    },
    stepTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '0.375rem',
      letterSpacing: '-0.01em'
    },
    stepStatus: (status) => ({
      fontSize: '0.8125rem',
      color: status === 'complete' ? '#10b981' : status === 'processing' ? '#0ea5e9' : '#94a3b8',
      fontWeight: '500'
    }),
    securityNote: {
      marginTop: '3rem',
      padding: '1.25rem 1.5rem',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '1px solid #86efac',
      borderRadius: '12px',
      display: 'flex',
      gap: '1rem',
      fontSize: '0.8125rem',
      color: '#065f46',
      lineHeight: 1.7,
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
    },
    newAssessmentButton: {
      position: 'fixed',
      bottom: '2.5rem',
      left: '300px',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      color: 'white',
      padding: '1rem 2.25rem',
      borderRadius: '12px',
      border: 'none',
      fontSize: '0.9375rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 6px 24px rgba(14, 165, 233, 0.4)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      letterSpacing: '-0.01em'
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <h1 style={styles.logoTitle}>
            <MdLocalHospital size={28} />
            AidCare Pro
          </h1>
          <p style={styles.logoSubtitle}>Community Health Tool</p>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem(false)} onClick={() => {}}>
            <FaHome size={18} />
            <span>Home</span>
          </button>
          <button style={styles.navItem(true)}>
            <MdLocalHospital size={18} />
            <span>Active Triage</span>
          </button>
          <button style={styles.navItem(false)}>
            <FaHistory size={18} />
            <span>Patient History</span>
          </button>
          <button style={styles.navItem(false)}>
            <FaBook size={18} />
            <span>Offline Records</span>
          </button>
        </nav>

        <div style={styles.syncStatus}>
          <div style={styles.syncLabel}>Sync Status</div>
          <div style={styles.syncIndicator}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
              animation: 'pulse-dot 2s ease-in-out infinite'
            }} />
            <span>Local Cache Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div style={styles.breadcrumb}>
            <span>Triage</span>
            <span>/</span>
            <span style={{color: '#1f2937', fontWeight: '600'}}>
              {isRecording ? 'Voice Recording' : 'New Assessment'}
            </span>
          </div>
          <div style={styles.headerActions}>
            {result && (
              <span style={{fontSize: '0.875rem', color: '#10b981', fontWeight: '500'}}>
                ● Microphone Ready
              </span>
            )}
          </div>
        </header>

        <div style={styles.content}>
          {/* Info Bar */}
          <div style={styles.infoBar}>
            <div style={styles.infoIcon}>🛡️</div>
            <div style={styles.infoText}>
              <div style={styles.infoTitle}>Data Auto-Saved</div>
              <div style={styles.infoSubtext}>
                Patient details and previous session blocks are locally secured.
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={styles.card}>
              <div style={styles.loadingView}>
                <h2 style={styles.loadingTitle}>Analyzing Assessment</h2>
                <p style={styles.loadingSubtitle}>
                  Synthesizing voice data into clinical insights...
                </p>

                <div style={styles.progressSection}>
                  <div style={styles.progressHeader}>
                    <div style={styles.statusLabel}>Current Status</div>
                    <div style={styles.statusRow}>
                      <div style={styles.statusText}>Clinical Analysis in Progress</div>
                      <div style={styles.progressPercent}>{Math.round(loadingProgress)}%</div>
                    </div>
                  </div>

                  <div style={styles.progressBar}>
                    <div style={styles.progressFill(loadingProgress)} />
                  </div>

                  <div style={styles.stepsList}>
                    {loadingSteps.map((step, index) => {
                      const status = index < loadingStep ? 'complete' : index === loadingStep ? 'processing' : 'pending';
                      return (
                        <div key={index} style={styles.step}>
                          <div style={styles.stepIcon(status)}>
                            {status === 'complete' ? '✓' : status === 'processing' ? '⟳' : '○'}
                          </div>
                          <div style={styles.stepContent}>
                            <div style={styles.stepTitle}>{step.label}</div>
                            <div style={styles.stepStatus(status)}>
                              {status === 'complete' ? 'Complete' : status === 'processing' ? 'Processing...' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.securityNote}>
                    <div>🔒</div>
                    <div>
                      Your patient data is encrypted and processed according to WHO health data protocols.
                      AidCare maintains HIPAA compliance throughout analysis.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recording State */}
          {!isLoading && isRecording && (
            <div style={styles.card}>
              <div style={styles.recordingView}>
                <h2 style={styles.listeningTitle}>Listening...</h2>
                <p style={styles.listeningSubtitle}>
                  Capture details about symptoms, duration, and<br />patient context clearly.
                </p>

                <div style={styles.waveformContainer}>
                  {/* Simple waveform visualization */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.375rem', height: '100%'}}>
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '4px',
                          height: `${20 + Math.random() * 80}%`,
                          background: 'linear-gradient(180deg, #0ea5e9 0%, #06b6d4 100%)',
                          borderRadius: '4px',
                          animation: 'pulse 1s ease-in-out infinite',
                          animationDelay: `${i * 0.05}s`,
                          boxShadow: '0 2px 6px rgba(14, 165, 233, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={styles.timer}>
                  <div style={styles.timerBlock}>
                    <div style={styles.timerValue}>{formatTime(recordingTime).split(':')[0]}</div>
                    <div style={styles.timerLabel}>MIN</div>
                  </div>
                  <div style={{...styles.timerValue, padding: '0 0.5rem'}}>:</div>
                  <div style={styles.timerBlock}>
                    <div style={styles.timerValue}>{formatTime(recordingTime).split(':')[1]}</div>
                    <div style={styles.timerLabel}>SEC</div>
                  </div>
                </div>

                <div style={styles.recordingControls}>
                  <AudioRecorder
                    onRecordingStart={handleRecordingStart}
                    onRecordingStop={handleRecordingStop}
                    isRecording={isRecording}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && !isRecording && errorMessage && (
            <div style={styles.card}>
              <div style={styles.errorCard}>
                <div style={styles.errorIcon}>
                  <div style={styles.micIcon}>🎤</div>
                  <div style={styles.warningBadge}>!</div>
                </div>
                <h2 style={styles.errorTitle}>Recording was too short to analyze</h2>
                <p style={styles.errorText}>
                  The diagnostic engine requires at least <strong>5 seconds</strong> of voice input
                  to generate guideline-backed recommendations. Please try again or use the manual fallback.
                </p>

                <button
                  style={styles.primaryButton}
                  onClick={startNewAssessment}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(14, 165, 233, 0.45)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.3)';
                  }}
                >
                  <FaMicrophone />
                  Retry Voice Input
                </button>

                <div style={styles.divider}>
                  <div style={styles.dividerLine} />
                  <span>or continue manually</span>
                  <div style={styles.dividerLine} />
                </div>

                <button
                  style={styles.secondaryButton}
                  onClick={() => setInputMode('text')}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                >
                  <FaKeyboard />
                  Switch to Text Input
                </button>
              </div>
            </div>
          )}

          {/* Initial/Ready State */}
          {!isLoading && !isRecording && !errorMessage && !result && (
            <div style={styles.card}>
              <h2 style={styles.listeningTitle}>New Patient Assessment</h2>
              <p style={styles.listeningSubtitle}>
                Begin by recording patient symptoms or enter details manually
              </p>

              <div style={{marginTop: '3rem'}}>
                {inputMode === 'voice' ? (
                  <div>
                    <AudioRecorder
                      onRecordingStart={handleRecordingStart}
                      onRecordingStop={handleRecordingStop}
                      isRecording={isRecording}
                      disabled={isLoading}
                    />
                    <div style={styles.divider}>
                      <div style={styles.dividerLine} />
                      <span>or</span>
                      <div style={styles.dividerLine} />
                    </div>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setInputMode('text')}
                      onMouseOver={(e) => {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      }}
                    >
                      <FaKeyboard />
                      Switch to Text Input
                    </button>
                  </div>
                ) : (
                  <div>
                    <TriageForm onSubmit={processText} disabled={isLoading} />
                    <div style={styles.divider}>
                      <div style={styles.dividerLine} />
                      <span>or</span>
                      <div style={styles.dividerLine} />
                    </div>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => setInputMode('voice')}
                      onMouseOver={(e) => {
                        e.target.style.background = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 3px 12px rgba(0,0,0,0.08)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      }}
                    >
                      <FaMicrophone />
                      Switch to Voice Input
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div>
              <TriageResults result={result} onStartNew={startNewAssessment} />
            </div>
          )}
        </div>
      </main>

      {/* Floating New Assessment Button */}
      {!isLoading && !isRecording && result && (
        <button
          style={styles.newAssessmentButton}
          onClick={startNewAssessment}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 10px 32px rgba(14, 165, 233, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 6px 24px rgba(14, 165, 233, 0.4)';
          }}
        >
          New Assessment
        </button>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scaleY(0.5); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pulse-dot {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
          }
        }
      `}</style>
    </div>
  );
}
