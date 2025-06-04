// src/app/components/InputModeSelector.js
"use client";
import React from 'react';

export default function InputModeSelector({ onUseAudio, onUploadMedia, onManualInputFocus, isProcessing }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
      <button onClick={onUseAudio} disabled={isProcessing} style={buttonStyle}>
        <h4>Use audio</h4>
        <p style={pStyle}>Let us listen and extract key points</p>
      </button>
      <button onClick={onUploadMedia} disabled={isProcessing} style={buttonStyle}>
        <h4>Upload media</h4>
        <p style={pStyle}>Add files, images of lab results, etc</p>
      </button>
      {/* The manual input textarea will be directly on the page, this button could focus it */}
    </div>
  );
}
const buttonStyle = { padding: '15px', textAlign: 'left', borderRadius: '8px', border: '1px solid #eee', background: 'white', cursor: 'pointer' };
const pStyle = {margin: '5px 0 0', fontSize: '0.9em', color: '#555'};