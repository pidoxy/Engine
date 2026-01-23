'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaMicrophone, FaKeyboard, FaBell, FaQuestionCircle, FaUser } from 'react-icons/fa';
import { MdDashboard, MdAssessment, MdPeople, MdSettings, MdWifi } from 'react-icons/md';
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
  const [activeNav, setActiveNav] = useState('triage');

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

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: '#0a0f1a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    sidebar: {
      width: '200px',
      background: '#0f1419',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0'
    },
    logo: {
      padding: '0 1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    },
    logoText: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#fff'
    },
    logoSubtext: {
      fontSize: '0.625rem',
      color: '#6b7280',
      display: 'block',
      marginTop: '0.125rem'
    },
    nav: {
      flex: 1,
      padding: '0 0.75rem'
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      marginBottom: '0.25rem',
      borderRadius: '8px',
      background: active ? 'rgba(59, 158, 255, 0.15)' : 'transparent',
      color: active ? '#3b9eff' : '#6b7280',
      fontSize: '0.875rem',
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s'
    }),
    userSection: {
      padding: '1.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    userName: {
      fontSize: '0.8125rem',
      fontWeight: '600',
      color: '#fff',
      lineHeight: 1.2
    },
    userRole: {
      fontSize: '0.6875rem',
      color: '#6b7280'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '1.25rem 2rem',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    breadcrumbActive: {
      color: '#fff',
      fontWeight: '500'
    },
    headerActions: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    },
    iconButton: {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      border: 'none',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'all 0.2s'
    },
    content: {
      flex: 1,
      padding: '3rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      background: '#141b26',
      borderRadius: '16px',
      padding: '3.5rem 4rem',
      maxWidth: '600px',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.05)',
      textAlign: 'center'
    },
    cardTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '0.75rem'
    },
    cardSubtitle: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '3rem',
      lineHeight: 1.6
    },
    micButtonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '2.5rem'
    },
    micButton: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      border: 'none',
      color: '#fff',
      fontSize: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 8px 32px rgba(59, 158, 255, 0.3)'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '2rem 0',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: 'rgba(255,255,255,0.05)'
    },
    secondaryButton: {
      padding: '0.875rem 1.5rem',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.625rem',
      transition: 'all 0.2s'
    },
    processingCard: {
      background: '#141b26',
      borderRadius: '16px',
      padding: '3rem',
      maxWidth: '700px',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    processingHeader: {
      textAlign: 'center',
      marginBottom: '3rem'
    },
    processingTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '0.75rem'
    },
    processingSubtitle: {
      fontSize: '1rem',
      color: '#6b7280'
    },
    progressSection: {
      marginBottom: '2.5rem'
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    progressLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    progressDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#3b9eff'
    },
    progressPercent: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#3b9eff'
    },
    progressBar: {
      height: '8px',
      background: 'rgba(59, 158, 255, 0.1)',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    progressFill: (progress) => ({
      height: '100%',
      background: 'linear-gradient(90deg, #3b9eff 0%, #2d7fd3 100%)',
      width: `${progress}%`,
      transition: 'width 0.4s ease',
      borderRadius: '4px'
    }),
    stepsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      marginTop: '2.5rem'
    },
    step: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'relative'
    },
    stepIconContainer: {
      position: 'relative',
      zIndex: 2
    },
    stepIcon: (status) => ({
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: status === 'complete' ? '#10b981' : status === 'processing' ? '#3b9eff' : 'rgba(255,255,255,0.05)',
      border: `2px solid ${status === 'complete' ? '#10b981' : status === 'processing' ? '#3b9eff' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: status === 'complete' || status === 'processing' ? '#fff' : '#6b7280',
      fontSize: '1.125rem',
      fontWeight: '600'
    }),
    stepContent: {
      flex: 1
    },
    stepTitle: {
      fontSize: '0.9375rem',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    stepStatus: (status) => ({
      fontSize: '0.8125rem',
      color: status === 'complete' ? '#10b981' : status === 'processing' ? '#3b9eff' : '#6b7280'
    }),
    securityBadge: {
      marginTop: '2.5rem',
      padding: '1rem 1.25rem',
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.8125rem',
      color: '#10b981'
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚕️</div>
          <div>
            <div style={styles.logoText}>AidCare Pro</div>
            <span style={styles.logoSubtext}>Medical Triage</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem(activeNav === 'dashboard')} onClick={() => setActiveNav('dashboard')}>
            <MdDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button style={styles.navItem(activeNav === 'triage')} onClick={() => setActiveNav('triage')}>
            <MdAssessment size={18} />
            <span>Active Triage</span>
          </button>
          <button style={styles.navItem(activeNav === 'patients')} onClick={() => setActiveNav('patients')}>
            <MdPeople size={18} />
            <span>Patient History</span>
          </button>
          <button style={styles.navItem(activeNav === 'offline')} onClick={() => setActiveNav('offline')}>
            <MdWifi size={18} />
            <span>Offline Records</span>
          </button>
          <button style={styles.navItem(activeNav === 'settings')} onClick={() => setActiveNav('settings')}>
            <MdSettings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userAvatar}>DS</div>
          <div>
            <div style={styles.userName}>Dr Sarah Chen</div>
            <div style={styles.userRole}>Community Health Worker</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span>›</span>
            <span style={styles.breadcrumbActive}>New Assessment</span>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.iconButton}>
              <FaBell />
            </button>
            <button style={styles.iconButton}>
              <FaQuestionCircle />
            </button>
          </div>
        </header>

        <div style={styles.content}>
          {/* Loading State */}
          {isLoading && (
            <div style={styles.processingCard}>
              <div style={styles.processingHeader}>
                <h2 style={styles.processingTitle}>Analyzing Assessment</h2>
                <p style={styles.processingSubtitle}>Please wait while our AI models process the patient data.</p>
              </div>

              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <div style={styles.progressLabel}>
                    <div style={styles.progressDot} />
                    <span>Processing...</span>
                  </div>
                  <div style={styles.progressPercent}>{Math.round(loadingProgress)}%</div>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(loadingProgress)} />
                </div>
              </div>

              <div style={styles.stepsList}>
                {loadingSteps.map((step, index) => {
                  const status = index < loadingStep ? 'complete' : index === loadingStep ? 'processing' : 'pending';
                  return (
                    <div key={index} style={styles.step}>
                      <div style={styles.stepIconContainer}>
                        <div style={styles.stepIcon(status)}>
                          {status === 'complete' ? '✓' : status === 'processing' ? '⟳' : '○'}
                        </div>
                      </div>
                      <div style={styles.stepContent}>
                        <div style={styles.stepTitle}>{step.label}</div>
                        <div style={styles.stepStatus(status)}>
                          {status === 'complete' ? 'Completed successfully' : status === 'processing' ? 'Identifying key indicators...' : 'Pending analysis completion'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.securityBadge}>
                <div>🔒</div>
                <div>HIPAA Compliant Secure Processing</div>
              </div>
            </div>
          )}

          {/* Initial/Ready State */}
          {!isLoading && !isRecording && !result && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>New Patient Assessment</h2>
              <p style={styles.cardSubtitle}>
                Begin by recording patient symptoms or enter details manually.
              </p>

              {inputMode === 'voice' ? (
                <>
                  <div style={styles.micButtonContainer}>
                    <AudioRecorder
                      onRecordingStart={handleRecordingStart}
                      onRecordingStop={handleRecordingStop}
                      isRecording={isRecording}
                      disabled={isLoading}
                      customStyle={styles.micButton}
                    />
                  </div>

                  <div style={styles.divider}>
                    <div style={styles.dividerLine} />
                    <span>OR</span>
                    <div style={styles.dividerLine} />
                  </div>

                  <button
                    style={styles.secondaryButton}
                    onClick={() => setInputMode('text')}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <FaKeyboard />
                    Switch to Text Input
                  </button>
                </>
              ) : (
                <>
                  <TriageForm onSubmit={processText} disabled={isLoading} />
                  <div style={styles.divider}>
                    <div style={styles.dividerLine} />
                    <span>OR</span>
                    <div style={styles.dividerLine} />
                  </div>
                  <button
                    style={styles.secondaryButton}
                    onClick={() => setInputMode('voice')}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <FaMicrophone />
                    Switch to Voice Input
                  </button>
                </>
              )}
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
    </div>
  );
}
