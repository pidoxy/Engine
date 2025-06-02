"use client";

import React, { useState, useEffect, useCallback } from 'react';
// import Head from 'next/head'; // For dynamic titles if needed later
import AudioRecorder from '../../components/AudioRecorder'; // Path relative to app directory
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import PotentialConditionsDisplay from '../../components/PotentialConditionsDisplay';
import SuggestedInvestigationsDisplay from '../../components/SuggestedInvestigationsDisplay';
import MedicationConsiderationsDisplay from '../../components/MedicationConsiderationsDisplay';
import AlertsFlagsDisplay from '../../components/AlertsFlagsDisplay';
import SummaryDisplay from '../../components/SummaryDisplay';

export default function ClinicalSupportPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null); // Stores the full API response
  const [errorMessage, setErrorMessage] = useState('');

  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

  const handleRecordingStart = useCallback(() => {
    console.log("Clinical Page: Recording started...");
    setIsRecording(true);
    setAudioBlob(null);
    setApiResult(null);
    setErrorMessage('');
  }, []);

  const handleRecordingStop = useCallback((blob) => {
    setIsRecording(false);
    if (blob && blob.size > 0) {
      setAudioBlob(blob);
    } else {
      setErrorMessage("Recording failed or no audio data was captured.");
      setAudioBlob(null);
    }
  }, []);

  const processConsultationAudio = useCallback(async (blobToProcess) => {
    if (!blobToProcess) {
      setErrorMessage('No audio recorded to process.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    // setApiResult(null);

    const formData = new FormData();
    formData.append('audio_file', blobToProcess, `consult_recording_${Date.now()}.webm`); // Using webm as per recorder

    try {
      const response = await fetch(`${FASTAPI_URL}/clinical_support/process_consultation/`, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(responseData.detail || `HTTP error! Status: ${response.status}`);
      }
      console.log("API Success Response (Clinical Support):", responseData);
      setApiResult(responseData);
    } catch (error) {
      console.error('Error processing consultation:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      setApiResult(null);
      setAudioBlob(null);
    } finally {
      setIsLoading(false);
    }
  }, [FASTAPI_URL]);

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading) {
      processConsultationAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processConsultationAudio]);

  const startNewConsultation = () => {
    setAudioBlob(null);
    setApiResult(null);
    setErrorMessage('');
    setIsRecording(false);
  };
  
  // Destructure for easier access in JSX, only if apiResult and details exist
  const clinicalDetails = apiResult?.clinical_support_details;

  return (
    <>
      <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>AidCare Clinical Support</h1>
          <p>Listening to doctor-patient consultation...</p>
        </header>

        <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
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
          <div className="clinical-support-results" style={{marginTop: '20px'}}>
            {/* Optionally display transcript or extracted info */}
            {apiResult.transcript && (
              <details style={{marginBottom: '10px'}}>
                <summary><strong>Consultation Transcript (Summary)</strong></summary>
                <p style={{maxHeight: '150px', overflowY: 'auto', background:'#f0f0f0', padding: '10px', border: '1px solid #ddd'}}>
                    {apiResult.transcript}
                </p>
              </details>
            )}
            {apiResult.extracted_clinical_info && Object.keys(apiResult.extracted_clinical_info).length > 0 && (
                <details style={{marginBottom: '20px'}}>
                    <summary><strong>Extracted Clinical Information (Summary)</strong></summary>
                    <pre style={{maxHeight: '200px', overflowY: 'auto', background:'#f0f0f0', padding: '10px', border: '1px solid #ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                        {JSON.stringify(apiResult.extracted_clinical_info, null, 2)}
                    </pre>
                </details>
            )}

            <PotentialConditionsDisplay conditions={clinicalDetails.potential_conditions} />
            <SuggestedInvestigationsDisplay investigations={clinicalDetails.suggested_investigations} />
            <MedicationConsiderationsDisplay considerations={clinicalDetails.medication_considerations_info} />
            <AlertsFlagsDisplay alerts={clinicalDetails.alerts_and_flags} />
            <SummaryDisplay summary={clinicalDetails.differential_summary_for_doctor} />
          </div>
        )}

        {(apiResult || errorMessage) && !isLoading && (
          <button onClick={startNewConsultation} style={{ marginTop: '30px', padding: '10px 20px', fontSize: '1.1em' }}>
            Start New Consultation
          </button>
        )}
      </main>
    </>
  );
}