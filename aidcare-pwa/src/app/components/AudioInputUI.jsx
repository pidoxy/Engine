// src/app/components/AudioInputUI.js
"use client";
import React from 'react';

// This component will manage the visual "Tap to record" toggle
// and internally call the props for starting/stopping the actual MediaRecorder logic
// which might reside in a hook or the parent component.

export default function AudioInputUI({ isRecording, onToggleRecording, disabled }) {
  const handleToggle = () => {
    if (onToggleRecording) {
      onToggleRecording(); // Parent will handle actual start/stop logic
    }
  };

  return (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', // To push toggle to the right
        padding: '10px 15px', 
        backgroundColor: isRecording ? '#ffe0e0' : '#e8f0fe', // Light red when recording, light blue otherwise
        borderRadius: '25px', // Pill shape
        border: `1px solid ${isRecording ? '#ffc0c0' : '#c0d6f5'}`,
        marginBottom: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={!disabled ? handleToggle : undefined}
    >
      <span style={{ color: isRecording ? '#d9534f' : '#007bff', fontWeight: '500' }}>
        {isRecording ? '🔴 Listening...' : '🎤 Tap to record'}
      </span>
      {/* Basic Toggle Switch Visual */}
      <div style={{
          width: '40px',
          height: '20px',
          backgroundColor: isRecording ? '#4CAF50' : '#ccc',
          borderRadius: '10px',
          position: 'relative',
          transition: 'background-color 0.3s ease'
      }}>
          <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '2px',
              left: isRecording ? '22px' : '2px',
              transition: 'left 0.3s ease'
          }}></div>
      </div>
    </div>
  );
}