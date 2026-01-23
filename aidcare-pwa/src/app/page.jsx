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
      background: '#f8f9fb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    sidebar: {
      width: '240px',
      background: 'white',
      borderRight: '2px solid #e5e7eb',
      padding: '2rem 0',
      display: 'flex',
      flexDirection: 'column'
    },
    logo: {
      padding: '0 1.5rem 2rem',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '2rem'
    },
    logoTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1e7c89',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    logoSubtitle: {
      fontSize: '0.75rem',
      color: '#6b7280',
      margin: '0.25rem 0 0',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    },
    nav: {
      flex: 1,
      padding: '0 1rem'
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1rem',
      margin: '0 0 0.125rem 0',
      borderRadius: 0,
      background: active ? '#1e7c89' : 'transparent',
      color: active ? 'white' : '#6b7280',
      fontWeight: active ? '600' : '500',
      fontSize: '0.9375rem',
      cursor: 'pointer',
      border: 'none',
      borderLeft: active ? '4px solid #0d4f57' : '4px solid transparent',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.15s'
    }),
    syncStatus: {
      padding: '1.5rem',
      borderTop: '2px solid #e5e7eb'
    },
    syncLabel: {
      fontSize: '0.75rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '0.5rem'
    },
    syncIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#10b981'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    },
    header: {
      background: 'white',
      borderBottom: '2px solid #e5e7eb',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    headerActions: {
      display: 'flex',
      gap: '1rem'
    },
    content: {
      flex: 1,
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    },
    infoBar: {
      background: '#e6f4f6',
      border: '2px solid #1e7c89',
      borderRadius: 0,
      padding: '1rem 1.25rem',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      borderLeft: '4px solid #1e7c89'
    },
    infoIcon: {
      color: '#1e7c89',
      fontSize: '1.25rem'
    },
    infoText: {
      flex: 1
    },
    infoTitle: {
      fontWeight: '600',
      color: '#1e7c89',
      fontSize: '0.9375rem',
      marginBottom: '0.25rem'
    },
    infoSubtext: {
      color: '#4b7b83',
      fontSize: '0.875rem',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: 0,
      padding: '3rem',
      boxShadow: 'none',
      border: '2px solid #e5e7eb',
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
      fontSize: '2.5rem',
      color: '#1e7c89'
    },
    warningBadge: {
      position: 'absolute',
      top: '-0.5rem',
      right: '-0.5rem',
      background: '#f59e0b',
      color: 'white',
      width: '1.75rem',
      height: '1.75rem',
      borderRadius: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    },
    errorTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem'
    },
    errorText: {
      color: '#6b7280',
      fontSize: '1rem',
      lineHeight: 1.6,
      marginBottom: '2rem',
      maxWidth: '500px',
      margin: '0 auto 2rem'
    },
    primaryButton: {
      background: '#1e7c89',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: 0,
      border: '2px solid #1e7c89',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '200px',
      justifyContent: 'center',
      transition: 'all 0.15s',
      marginBottom: '1rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    secondaryButton: {
      background: 'white',
      color: '#374151',
      padding: '0.875rem 1.5rem',
      borderRadius: 0,
      border: '2px solid #e5e7eb',
      fontSize: '0.9375rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
      transition: 'all 0.15s',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.5rem 0',
      color: '#9ca3af',
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#e5e7eb'
    },
    recordingView: {
      textAlign: 'center'
    },
    listeningTitle: {
      fontSize: '2rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    listeningSubtitle: {
      color: '#6b7280',
      fontSize: '1rem',
      marginBottom: '3rem',
      lineHeight: 1.6
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
      fontSize: '3rem',
      fontWeight: '600',
      color: '#1e7c89',
      fontVariantNumeric: 'tabular-nums'
    },
    timerLabel: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginTop: '0.25rem'
    },
    recordingControls: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem'
    },
    controlButton: (variant = 'default') => ({
      width: variant === 'stop' ? '5rem' : '4rem',
      height: variant === 'stop' ? '5rem' : '4rem',
      borderRadius: 0,
      border: variant === 'stop' ? '2px solid #1e7c89' : '2px solid #e5e7eb',
      background: variant === 'stop' ? '#1e7c89' : 'white',
      color: variant === 'stop' ? 'white' : '#6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.5rem',
      transition: 'all 0.15s'
    }),
    loadingView: {
      textAlign: 'center',
      padding: '3rem 2rem'
    },
    loadingTitle: {
      fontSize: '2rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    loadingSubtitle: {
      color: '#6b7280',
      fontSize: '1rem',
      marginBottom: '3rem'
    },
    progressSection: {
      maxWidth: '600px',
      margin: '0 auto',
      background: '#f9fafb',
      borderRadius: 0,
      padding: '2rem',
      border: '2px solid #e5e7eb'
    },
    progressHeader: {
      marginBottom: '1.5rem'
    },
    statusLabel: {
      fontSize: '0.75rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.5rem'
    },
    statusRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    statusText: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    progressPercent: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1e7c89'
    },
    progressBar: {
      height: '0.5rem',
      background: '#e5e7eb',
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: '2rem',
      border: '1px solid #d1d5db'
    },
    progressFill: (progress) => ({
      height: '100%',
      background: '#1e7c89',
      width: `${progress}%`,
      transition: 'width 0.3s ease'
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
      width: '2rem',
      height: '2rem',
      borderRadius: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: status === 'complete' ? '#10b981' : status === 'processing' ? '#1e7c89' : '#e5e7eb',
      color: status === 'complete' || status === 'processing' ? 'white' : '#9ca3af',
      border: '2px solid ' + (status === 'complete' ? '#10b981' : status === 'processing' ? '#1e7c89' : '#d1d5db')
    }),
    stepContent: {
      flex: 1,
      paddingTop: '0.25rem'
    },
    stepTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.25rem'
    },
    stepStatus: (status) => ({
      fontSize: '0.875rem',
      color: status === 'complete' ? '#10b981' : status === 'processing' ? '#3b82f6' : '#9ca3af'
    }),
    securityNote: {
      marginTop: '3rem',
      padding: '1rem 1.25rem',
      background: '#f0fdf4',
      border: '2px solid #10b981',
      borderRadius: 0,
      borderLeft: '4px solid #10b981',
      display: 'flex',
      gap: '0.75rem',
      fontSize: '0.875rem',
      color: '#166534',
      lineHeight: 1.6
    },
    newAssessmentButton: {
      position: 'fixed',
      bottom: '2rem',
      left: '280px',
      background: '#1e7c89',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: 0,
      border: '2px solid #1e7c89',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: 'none',
      transition: 'all 0.15s',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
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
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: 0,
              background: '#10b981'
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
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', height: '100%'}}>
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '0.25rem',
                          height: `${20 + Math.random() * 80}%`,
                          background: '#1e7c89',
                          borderRadius: 0,
                          animation: 'pulse 1s ease-in-out infinite',
                          animationDelay: `${i * 0.05}s`
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
                  onMouseOver={(e) => e.target.style.background = '#176b76'}
                  onMouseOut={(e) => e.target.style.background = '#1e7c89'}
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
                  onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
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
                      onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                      onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
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
                      onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                      onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
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
            e.target.style.background = '#176b76';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(30, 124, 137, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#1e7c89';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(30, 124, 137, 0.3)';
          }}
        >
          New Assessment
        </button>
      )}

      {/* Pulse animation for waveform */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
