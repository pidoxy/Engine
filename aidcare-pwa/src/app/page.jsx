'use client'

import React, { useState, useCallback, useRef } from 'react';
import { FaStethoscope, FaMicrophone, FaKeyboard, FaHistory, FaTimes } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import AudioRecorder from './components/AudioRecorder';
import TriageForm from './components/triage/TriageForm';
import TriageResults from './components/triage/TriageResults';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

export default function TriageDashboard() {
  // Input mode state
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'

  // Processing state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingComplete, setLoadingComplete] = useState(false);

  // History sidebar state
  const [showHistory, setShowHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Refs
  const processedBlobRef = useRef(null);

  const FASTAPI_URL = process.env.NEXT_PUBLIC_AIDCARE_API_BASE_URL || 'http://localhost:8000';

  // Recording handlers
  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setAudioBlob(null);
    setResult(null);
    setErrorMessage('');
    setLoadingComplete(false);
    processedBlobRef.current = null;
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
      processedBlobRef.current = null;
    } else {
      setErrorMessage("Recording failed. Please try again.");
    }
  }, []);

  // Process audio
  const processAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess || processedBlobRef.current === blobToProcess) return;

    processedBlobRef.current = blobToProcess;
    setIsLoading(true);
    setLoadingComplete(false);
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

      setLoadingComplete(true);

      setTimeout(() => {
        setResult(responseData);
        addToHistory(responseData);
        setAudioBlob(null);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during processing.');
      processedBlobRef.current = null;
      setIsLoading(false);
      setLoadingComplete(false);
    }
  }, [FASTAPI_URL]);

  // Process text
  const processText = useCallback(async (textData) => {
    if (!textData || !textData.symptoms) {
      setErrorMessage('Please enter symptoms before submitting.');
      return;
    }

    setIsLoading(true);
    setLoadingComplete(false);
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

      setLoadingComplete(true);

      setTimeout(() => {
        setResult(responseData);
        addToHistory(responseData);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setErrorMessage(error.message || 'An error occurred during processing.');
      setIsLoading(false);
      setLoadingComplete(false);
    }
  }, [FASTAPI_URL]);

  // Auto-process audio when blob is ready
  React.useEffect(() => {
    if (audioBlob && !isRecording && !isLoading && processedBlobRef.current !== audioBlob) {
      processAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processAudio]);

  // Add result to history
  const addToHistory = (resultData) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      result: resultData
    };
    setSessionHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10
  };

  // Start new session
  const startNewSession = () => {
    setAudioBlob(null);
    setResult(null);
    setErrorMessage('');
    setIsRecording(false);
    setLoadingComplete(false);
    processedBlobRef.current = null;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb',
      padding: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      background: 'linear-gradient(135deg, #3b82f6, #10b981)',
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
      fontSize: '0.75rem',
      color: '#6b7280',
      margin: 0
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    hipaaLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#10b981',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    historyButton: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      color: '#374151',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    mainLayout: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem 1rem',
      display: 'grid',
      gridTemplateColumns: showHistory ? '1fr 320px' : '1fr',
      gap: '2rem',
      transition: 'grid-template-columns 0.3s ease'
    },
    mainContent: {
      minWidth: 0
    },
    pageHeader: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    pageTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 0.5rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem'
    },
    pageSubtitle: {
      fontSize: '1rem',
      color: '#6b7280',
      margin: 0
    },
    inputSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    },
    inputModeToggle: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      background: '#f9fafb',
      padding: '0.25rem',
      borderRadius: '0.75rem',
      width: 'fit-content',
      margin: '0 auto 1.5rem'
    },
    inputModeButton: (active) => ({
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      background: active ? 'white' : 'transparent',
      color: active ? '#3b82f6' : '#6b7280',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s',
      boxShadow: active ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
    }),
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '1.5rem'
    },
    resultsSection: {
      marginTop: '2rem'
    },
    historySidebar: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      maxHeight: 'calc(100vh - 200px)',
      overflow: 'auto',
      position: 'sticky',
      top: '120px'
    },
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid #e5e7eb'
    },
    historyTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      margin: 0
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '0.25rem'
    },
    historyItem: {
      padding: '1rem',
      marginBottom: '0.75rem',
      background: '#f9fafb',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid transparent'
    },
    emptyHistory: {
      textAlign: 'center',
      color: '#9ca3af',
      fontSize: '0.875rem',
      padding: '2rem 1rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <FaStethoscope size={24} />
            </div>
            <div>
              <h1 style={styles.logoText}>AidCare</h1>
              <p style={styles.logoSubtext}>AI Medical Assistant</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.hipaaLabel}>
              <MdHealthAndSafety size={20} />
              <span>HIPAA Compliant</span>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                ...styles.historyButton,
                background: showHistory ? '#f0f9ff' : 'white',
                borderColor: showHistory ? '#3b82f6' : '#e5e7eb'
              }}
              onMouseOver={(e) => e.target.style.background = '#f0f9ff'}
              onMouseOut={(e) => e.target.style.background = showHistory ? '#f0f9ff' : 'white'}
            >
              {showHistory ? <FaTimes size={16} /> : <FaHistory size={16} />}
              <span>{showHistory ? 'Close' : 'History'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Page Header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>
              <MdLocalHospital size={32} />
              <span>AI Triage Assistant</span>
            </h1>
            <p style={styles.pageSubtitle}>
              Describe patient symptoms using voice or text for instant triage assessment
            </p>
          </div>

          {/* Input Section */}
          <div style={styles.inputSection}>
            {/* Input Mode Toggle */}
            <div style={styles.inputModeToggle}>
              <button
                onClick={() => setInputMode('voice')}
                style={styles.inputModeButton(inputMode === 'voice')}
              >
                <FaMicrophone size={14} />
                <span>Voice</span>
              </button>
              <button
                onClick={() => setInputMode('text')}
                style={styles.inputModeButton(inputMode === 'text')}
              >
                <FaKeyboard size={14} />
                <span>Text</span>
              </button>
            </div>

            {/* Status Badge */}
            {isRecording && (
              <div style={{textAlign: 'center'}}>
                <div style={{
                  ...styles.statusBadge,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <FaMicrophone size={16} />
                  <span>Recording...</span>
                </div>
              </div>
            )}

            {isLoading && (
              <div style={{textAlign: 'center'}}>
                <div style={{
                  ...styles.statusBadge,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <FaStethoscope size={16} />
                  <span>Analyzing...</span>
                </div>
              </div>
            )}

            {/* Input Controls */}
            {inputMode === 'voice' ? (
              <AudioRecorder
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
                isRecording={isRecording}
                disabled={isLoading}
              />
            ) : (
              <TriageForm onSubmit={processText} disabled={isLoading} />
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={styles.inputSection}>
              <LoadingSpinner onComplete={loadingComplete} />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div style={styles.inputSection}>
              <ErrorMessage message={errorMessage} />
              <div style={{textAlign: 'center', marginTop: '1rem'}}>
                <button
                  onClick={startNewSession}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={styles.resultsSection}>
              <TriageResults result={result} onStartNew={startNewSession} />
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <aside style={styles.historySidebar}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>
                <FaHistory size={18} style={{marginRight: '0.5rem', verticalAlign: 'middle'}} />
                Session History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                style={styles.closeButton}
                onMouseOver={(e) => e.target.style.color = '#1f2937'}
                onMouseOut={(e) => e.target.style.color = '#6b7280'}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {sessionHistory.length === 0 ? (
              <div style={styles.emptyHistory}>
                No previous sessions
              </div>
            ) : (
              sessionHistory.map((item) => (
                <div
                  key={item.id}
                  style={styles.historyItem}
                  onClick={() => setResult(item.result)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem'}}>
                    {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: item.result?.triage_level === 'URGENT' ? '#dc2626' :
                           item.result?.triage_level === 'SEMI-URGENT' ? '#f59e0b' : '#10b981',
                    marginBottom: '0.25rem'
                  }}>
                    {item.result?.triage_level || 'Completed'}
                  </div>
                  <div style={{fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4}}>
                    {item.result?.symptoms_summary?.substring(0, 60)}...
                  </div>
                </div>
              ))
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
