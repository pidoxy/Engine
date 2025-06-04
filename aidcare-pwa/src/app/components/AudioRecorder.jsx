// src/app/components/AudioRecorder.js
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop, FaMicrophoneSlash } from 'react-icons/fa';

// Props: onRecordingStart, onRecordingStop (passes Blob back), isRecording (boolean), disabled (boolean)
export default function AudioRecorder({ onRecordingStart, onRecordingStop, isRecording, disabled }) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // Permission states: 'unknown', 'prompt', 'granted', 'denied'
  const [permissionState, setPermissionState] = useState('unknown');
  const [userMessage, setUserMessage] = useState(''); // To display messages/errors

  const updatePermissionStatus = useCallback(async () => {
    if (typeof navigator.permissions?.query !== 'function') {
      // Fallback for browsers that don't support permissions.query (older ones, or some specific contexts)
      // We'll try to get user media directly when start is clicked.
      // For now, assume 'prompt' as we can't know for sure.
      console.warn("navigator.permissions.query not supported. Will attempt direct getUserMedia on start.");
      setPermissionState('prompt'); // Or 'unknown' if you prefer to show a different initial message
      setUserMessage('Microphone access is needed. Click "Start Recording" to request permission.');
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      setPermissionState(permissionStatus.state);
      setUserMessage(getMessageForPermissionState(permissionStatus.state));

      permissionStatus.onchange = () => {
        setPermissionState(permissionStatus.state);
        setUserMessage(getMessageForPermissionState(permissionStatus.state));
      };
    } catch (err) {
      console.error("Error querying microphone permission:", err);
      setPermissionState('denied'); // Assume denied if query fails
      setUserMessage('Could not check microphone permission. Please ensure it is not blocked.');
    }
  }, []);

  useEffect(() => {
    updatePermissionStatus();
  }, [updatePermissionStatus]);

  const getMessageForPermissionState = (state) => {
    switch (state) {
      case 'granted':
        return ''; // No message needed if granted
      case 'prompt':
        return 'Microphone access is needed. Click "Start Recording" to request permission.';
      case 'denied':
        return 'Microphone permission was denied. Please enable it in your browser site settings for localhost:3000 and reload the page.';
      case 'unknown':
      default:
        return 'Checking microphone permission...';
    }
  };

  const requestMicPermissionAndGetStream = async () => {
    setUserMessage('Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If successful, permission state will update via onchange or next query
      updatePermissionStatus(); // Re-check and update UI message
      return stream;
    } catch (err) {
      console.error("Error getting user media:", err.name, err.message);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setUserMessage('Microphone permission was denied. Please enable it in your browser site settings and reload.');
        setPermissionState('denied');
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setUserMessage('No microphone found. Please ensure a microphone is connected and enabled.');
        setPermissionState('denied'); // Treat as effectively denied for functionality
      } else {
        setUserMessage('Could not access microphone. It might be in use or not available.');
        setPermissionState('denied'); // Treat as effectively denied
      }
      return null;
    }
  };

  const handleStartRecording = async () => {
    setUserMessage(''); // Clear previous messages
    let stream = null;

    if (permissionState !== 'granted') {
      stream = await requestMicPermissionAndGetStream();
      if (!stream) {
        onRecordingStop(null); // Notify parent that we couldn't start
        return;
      }
    } else {
      // Permission already granted, just get the stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("Error getting stream even with permission:", err);
        setUserMessage('Failed to access microphone. It might be busy.');
        onRecordingStop(null);
        return;
      }
    }
    
    onRecordingStart(); // Notify parent we are starting

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Prefer webm for better compatibility/size
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      onRecordingStop(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    try {
        mediaRecorderRef.current.start();
    } catch (e) {
        console.error("Error calling mediaRecorder.start():", e);
        setUserMessage("Could not start MediaRecorder. Your browser might not support the selected audio format or is missing codecs.");
        stream.getTracks().forEach(track => track.stop());
        onRecordingStop(null);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  let buttonText = "Start Recording";
  let buttonIcon = <FaMicrophone size={24} />;
  
  if (permissionState === 'prompt' || permissionState === 'unknown') {
    buttonText = "Enable Mic & Start";
    buttonIcon = <FaMicrophone size={24} />;
  } else if (permissionState === 'denied') {
    buttonText = "Mic Denied - Check Settings";
    buttonIcon = <FaMicrophoneSlash size={24} />;
  }

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    },
    startButton: {
      background: permissionState === 'denied' 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : 'linear-gradient(135deg, #059669, #047857)',
      color: 'white',
      padding: '1.25rem 2.5rem',
      borderRadius: '1rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      border: 'none',
      cursor: disabled || permissionState === 'denied' ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '250px',
      justifyContent: 'center',
      boxShadow: permissionState === 'denied' 
        ? '0 4px 12px rgba(239, 68, 68, 0.3)'
        : '0 4px 12px rgba(5, 150, 105, 0.3)',
      transition: 'all 0.3s ease',
      opacity: disabled || permissionState === 'denied' ? 0.6 : 1
    },
    stopButton: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      padding: '1.25rem 2.5rem',
      borderRadius: '1rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '250px',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      transition: 'all 0.3s ease',
      opacity: disabled ? 0.6 : 1,
      animation: 'pulse 2s infinite'
    },
    recordingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      borderRadius: '9999px',
      fontSize: '1rem',
      fontWeight: '500',
      border: '2px solid rgba(239, 68, 68, 0.2)',
      animation: 'pulse 2s infinite'
    },
    recordingIcon: {
      fontSize: '1.25rem',
      animation: 'pulse 1s infinite'
    },
    userMessage: {
      color: permissionState === 'denied' ? '#dc2626' : '#6b7280',
      fontSize: '0.875rem',
      textAlign: 'center',
      maxWidth: '350px',
      lineHeight: 1.5,
      padding: '0.75rem 1rem',
      background: permissionState === 'denied' 
        ? 'rgba(239, 68, 68, 0.05)' 
        : 'rgba(107, 114, 128, 0.05)',
      borderRadius: '0.5rem',
      border: `1px solid ${permissionState === 'denied' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
    }
  };

  return (
    <div style={styles.container}>
      {!isRecording ? (
        <button 
          style={styles.startButton}
          onClick={handleStartRecording} 
          disabled={disabled || permissionState === 'denied'} // Disable if denied, let user fix in settings
          onMouseOver={(e) => {
            if (!disabled && permissionState !== 'denied') {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!disabled && permissionState !== 'denied') {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
            }
          }}
        >
          {buttonIcon}
          <span>{buttonText}</span>
        </button>
      ) : (
        <button 
          style={styles.stopButton}
          onClick={handleStopRecording} 
          disabled={disabled}
          onMouseOver={(e) => {
            if (!disabled) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!disabled) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }
          }}
        >
          <FaStop size={24} />
          <span>Stop Recording</span>
        </button>
      )}
      
      {isRecording && (
        <div style={styles.recordingIndicator}>
          <FaMicrophone style={styles.recordingIcon} />
          <span>Recording in progress...</span>
        </div>
      )}
      
      {userMessage && (
        <div style={styles.userMessage}>
          {userMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}