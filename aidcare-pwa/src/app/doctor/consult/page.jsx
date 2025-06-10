// src/app/doctor/consult/page.js
"use client";

import AudioRecorder from '@/app/components/AudioRecorder';
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function ClinicalSupportPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualContext, setManualContext] = useState(''); // <--- State for manual input
  const [currentPatientUuid, setCurrentPatientUuid] = useState("test-patient-123"); // Placeholder - manage this properly later

  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
  const processingInitiatedRef = useRef(false);

  // ... (handleRecordingStart, handleRecordingStop - should clear manualContext if starting fresh for new audio) ...
  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setAudioBlob(null);
    setApiResult(null);
    setErrorMessage('');
    // setManualContext(''); // Optional: clear manual context when new audio recording starts
    processingInitiatedRef.current = false;
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
      processingInitiatedRef.current = false; 
    } else {
      setErrorMessage("Recording failed or no audio data captured.");
      setAudioBlob(null);
      processingInitiatedRef.current = false;
    }
  }, []);

  const processConsultationAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess) {
      setErrorMessage('No audio recorded to process.');
      return;
    }
    if (!currentPatientUuid) {
      setErrorMessage('Patient UUID is missing.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setApiResult(null); // Clear previous results before new API call

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `consult_recording_${Date.now()}.webm`);
    formData.append('manual_context', manualContext); // <--- SENDING MANUAL CONTEXT

    try {
      const response = await fetch(`${FASTAPI_URL}/clinical_support/process_consultation/${currentPatientUuid}`, { // Pass patient_uuid in URL
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }
      setApiResult(responseData);
      setAudioBlob(null); // Clear blob after successful processing
    } catch (error) {
      setErrorMessage(error.message || 'An unknown error occurred.');
      setApiResult(null);
      // setAudioBlob(null); // Optional: clear blob on error
    } finally {
      setIsLoading(false);
      processingInitiatedRef.current = false;
    }
  }, [FASTAPI_URL, manualContext, currentPatientUuid]); // Added manualContext and currentPatientUuid to dependencies

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading && !processingInitiatedRef.current) {
      processingInitiatedRef.current = true;
      processConsultationAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processConsultationAudio]);

  const startNewConsultation = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setIsLoading(false);
    setApiResult(null);
    setErrorMessage('');
    setManualContext(''); // Clear manual context for new session
    processingInitiatedRef.current = false;
    // Maybe reset currentPatientUuid or prompt for a new one
  };
  
  const clinicalDetails = apiResult?.clinical_support_details;

  return (
    <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>AidCare Clinical Support</h1>
        {/* Basic Patient ID input for testing */}
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="patientIdInput">Test Patient UUID: </label>
          <input 
            id="patientIdInput"
            type="text" 
            value={currentPatientUuid} 
            onChange={(e) => setCurrentPatientUuid(e.target.value)} 
            placeholder="Enter Patient UUID"
            style={{padding: "5px"}}
            disabled={isLoading || isRecording}
          />
        </div>
      </header>

      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h4>Key Patient History / Manual Context (Optional)</h4>
        <textarea
          value={manualContext}
          onChange={(e) => setManualContext(e.target.value)}
          rows={4}
          placeholder="e.g., Known diabetic on metformin, Allergic to penicillin (rash), Recent travel..."
          style={{ width: 'calc(100% - 16px)', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          disabled={isLoading || isRecording}
        />
        <AudioRecorder
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          isRecording={isRecording}
          disabled={isLoading}
        />
      </section>
      
      {isLoading && <LoadingSpinner />}
      {errorMessage && <ErrorMessage message={errorMessage} />}
      {apiResult && clinicalDetails && (
        <RecommendationDisplay result={apiResult} /> // Assuming this component can handle the clinical_support_details structure
      )}

      {(apiResult || errorMessage) && !isLoading && (
        <button onClick={startNewConsultation} style={{ marginTop: '30px', padding: '10px 20px', fontSize: '1.1em' }}>
          Start New Consultation
        </button>
      )}
    </main>
  );
}