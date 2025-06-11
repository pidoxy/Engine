// src/app/components/InputModeSelector.js
"use client";
import React, {useState} from 'react';

const buttonBaseStyle = {
  padding: '20px',
  textAlign: 'left',
  borderRadius: '12px',
  border: '1px solid #e0e0e0',
  background: '#ffffff',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  transition: 'transform 0.1s ease-in-out',
};

const buttonActiveStyle = {
  transform: 'scale(0.98)',
};

const h4Style = {
    margin: '0 0 5px 0',
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#333'
};

const pStyle = {
    margin: '0',
    fontSize: '0.9em',
    color: '#666'
};

export default function InputModeSelector({ onUseAudio, onUploadMedia, onEnterTextManually, isProcessing }) {
  const [activeButton, setActiveButton] = useState(null);

  const handlePress = (handler, buttonName) => {
    if (isProcessing) return;
    setActiveButton(buttonName);
    setTimeout(() => {
        handler();
        setActiveButton(null);
    }, 150); // Short delay for visual feedback
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
      <button 
        onClick={() => handlePress(onUseAudio, 'audio')} 
        disabled={isProcessing} 
        style={{...buttonBaseStyle, ...(activeButton === 'audio' ? buttonActiveStyle : {})}}
      >
        <h4 style={h4Style}>Use audio</h4>
        <p style={pStyle}>Let us listen and extract key points</p>
      </button>
      <button 
        onClick={() => handlePress(onUploadMedia, 'media')} 
        disabled={isProcessing} 
        style={{...buttonBaseStyle, ...(activeButton === 'media' ? buttonActiveStyle : {})}}
      >
        <h4 style={h4Style}>Upload media</h4>
        <p style={pStyle}>Add files, images of lab results, etc</p>
      </button>
      {/* The manual text input is a textarea on the page, this button can focus it or reveal it */}
      <button 
        onClick={() => handlePress(onEnterTextManually, 'manual')} 
        disabled={isProcessing} 
        style={{...buttonBaseStyle, ...(activeButton === 'manual' ? buttonActiveStyle : {})}}
      >
        <h4 style={h4Style}>Enter notes manually</h4>
        <p style={pStyle}>Type patient history or symptoms</p>
      </button>
    </div>
  );
}