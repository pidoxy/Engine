// src/app/components/DocumentUploader.js
"use client";

import React, { useState, useCallback, useRef } from 'react';

export default function DocumentUploader({ patientId, onUploadSuccess, onUploadError, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const fileInputRef = useRef(null); // To reset the file input

  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setFeedbackMessage(''); // Clear previous messages
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setFeedbackMessage('Please select a file to upload.');
      return;
    }
    if (!patientId) {
      setFeedbackMessage('Patient ID is missing. Cannot upload document.');
      if (onUploadError) onUploadError('Patient ID is missing for document upload.');
      return;
    }

    setIsUploading(true);
    setFeedbackMessage(`Uploading ${selectedFile.name}...`);

    const formData = new FormData();
    formData.append('file', selectedFile); // Backend expects 'file'

    try {
      const response = await fetch(`${FASTAPI_URL}/patients/${patientId}/upload_document/`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Document Upload API Error:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }

      setFeedbackMessage(`Successfully uploaded "${responseData.original_filename}". Queued for processing (Doc UUID: ${responseData.document_uuid}).`);
      setSelectedFile(null); // Clear selected file
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input field
      }
      if (onUploadSuccess) onUploadSuccess(responseData);

    } catch (error) {
      console.error('Error uploading document:', error);
      const message = error.message || 'An unknown error occurred during upload.';
      setFeedbackMessage(`Upload failed: ${message}`);
      if (onUploadError) onUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, patientId, FASTAPI_URL, onUploadSuccess, onUploadError]);

  return (
    <div style={{ border: '1px dashed #007bff', padding: '15px', borderRadius: '5px', marginTop: '10px', backgroundColor: '#f0f8ff' }}>
      <h5 style={{marginTop: 0, marginBottom: '10px'}}>Upload New Patient Document</h5>
      <input 
        id="file-upload-input" // Used for programmatic reset
        ref={fileInputRef}      // Ref for reset
        type="file" 
        onChange={handleFileChange} 
        disabled={isUploading || disabled} 
        accept=".pdf,.jpg,.jpeg,.png,.txt" // Specify acceptable file types
        style={{ display: 'block', marginBottom: '10px' }}
      />
      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || isUploading || disabled}
        style={{padding: '8px 15px', cursor: 'pointer'}}
      >
        {isUploading ? 'Uploading...' : 'Upload Selected File'}
      </button>
      {feedbackMessage && (
        <p style={{ 
            marginTop: '10px', 
            fontSize: '0.9em',
            color: feedbackMessage.startsWith('Upload failed') ? 'red' : 
                   feedbackMessage.startsWith('Successfully uploaded') ? 'green' : 
                   '#555' 
        }}>
          {feedbackMessage}
        </p>
      )}
    </div>
  );
}