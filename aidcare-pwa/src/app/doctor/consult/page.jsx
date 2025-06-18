"use client";

import AudioRecorder from '@/app/components/AudioRecorder';
import ErrorMessage from '@/app/components/ErrorMessage';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PotentialConditionsDisplay from '../../components/PotentialConditionsDisplay';
import SuggestedInvestigationsDisplay from '../../components/SuggestedInvestigationsDisplay';
import MedicationConsiderationsDisplay from '../../components/MedicationConsiderationsDisplay';
import AlertsFlagsDisplay from '../../components/AlertsFlagsDisplay';
import SummaryDisplay from '../../components/SummaryDisplay'; 
import DocumentUploader from '@/app/components/DocumentUploader';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ClinicalSupportPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualContext, setManualContext] = useState(''); 
  const [currentPatientUuid, setCurrentPatientUuid] = useState("");
  const [patientDocuments, setPatientDocuments] = useState([]); 
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);


  const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
  const processingInitiatedRef = useRef(false);

    // --- Function to fetch patient documents ---
  const fetchPatientDocuments = useCallback(async (patientUuid) => {
    if (!patientUuid || patientUuid.trim() === "") {
      setPatientDocuments([]); // Clear documents if no patient UUID
      return;
    }
    setIsLoadingDocuments(true);
    try {
      const response = await fetch(`${FASTAPI_URL}/patients/${patientUuid}/documents/`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || `Failed to fetch documents: ${response.status}`);
      }
      const data = await response.json();
      setPatientDocuments(data);
    } catch (error) {
      console.error("Error fetching patient documents:", error);
      setErrorMessage(`Failed to load documents: ${error.message}`); // Show error related to docs
      setPatientDocuments([]); // Clear on error
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [FASTAPI_URL]);

  // --- Fetch documents when patient UUID changes ---
  useEffect(() => {
    if (currentPatientUuid && currentPatientUuid.trim() !== "") {
      fetchPatientDocuments(currentPatientUuid.trim());
    } else {
      setPatientDocuments([]); // Clear if UUID is removed
    }
  }, [currentPatientUuid, fetchPatientDocuments]);

  // Set currentPatientUuid from URL query param if present
  useEffect(() => {
    const patientIdFromQuery = searchParams.get('patient');
    if (patientIdFromQuery && patientIdFromQuery !== currentPatientUuid) {
      setCurrentPatientUuid(patientIdFromQuery);
    }
  }, [searchParams, currentPatientUuid]);

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
  }, [FASTAPI_URL, manualContext, currentPatientUuid]); 

  useEffect(() => {
    if (audioBlob && !isRecording && !isLoading && !processingInitiatedRef.current) {
      processingInitiatedRef.current = true;
      processConsultationAudio(audioBlob);
    }
  }, [audioBlob, isRecording, isLoading, processConsultationAudio, currentPatientUuid]);

  // --- Handlers for DocumentUploader ---
  const handleDocumentUploadSuccess = (uploadedDocData) => {
    console.log("Document upload successful (queued):", uploadedDocData);
    setErrorMessage(''); // Clear any previous errors
    setTimeout(() => {
        if (currentPatientUuid && currentPatientUuid.trim() !== "") {
            fetchPatientDocuments(currentPatientUuid.trim());
        }
    }, 2000); // 2-second delay
  };

  const handleDocumentUploadError = (uploadErrorMsg) => {
    console.error("Document upload failed on frontend:", uploadErrorMsg);
    setErrorMessage(`Document Upload Failed: ${uploadErrorMsg}`);
  };

  const startNewConsultation = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setIsLoading(false);
    setApiResult(null);
    setErrorMessage('');
    setManualContext(''); // Clear manual context for new session
    processingInitiatedRef.current = false;
  };
  
  const clinicalDetails = apiResult?.clinical_support_details;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>AI Clinical Support</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            AI-powered clinical decision support system
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ 
            padding: '0.25rem 0.75rem',
            background: user?.role === 'admin' ? '#dc3545' : user?.role === 'consultant' ? '#007bff' : '#28a745',
            color: 'white',
            borderRadius: '12px',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            {user?.role || 'User'}
          </span>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Patient ID input for testing */}
        <div style={{ 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Patient Selection</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="patientIdInput" style={{ fontWeight: '500' }}>Patient UUID:</label>
            <input 
              id="patientIdInput"
              type="text" 
              value={currentPatientUuid} 
              onChange={(e) => {
                setCurrentPatientUuid(e.target.value);
                setApiResult(null); 
                setErrorMessage('');
              }}
              placeholder="Enter Patient UUID"
              style={{
                flex: 1,
                padding: "0.75rem",
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              disabled={isLoading || isRecording}
            />
            <button
              onClick={() => router.push('/patients')}
              style={{
                padding: '0.75rem 1rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Select Patient
            </button>
          </div>
        </div>

            {/* Consultation Input Area */}
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

      {/* Document Management Area */}
      {currentPatientUuid && currentPatientUuid.trim() !== "" && (
        <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
          <h3>Patient Documents ({currentPatientUuid})</h3>
          <DocumentUploader 
            patientId={currentPatientUuid.trim()}
            onUploadSuccess={handleDocumentUploadSuccess}
            onUploadError={handleDocumentUploadError}
          />
          <div style={{ marginTop: '15px' }}>
            <h4>Uploaded Documents:</h4>
            {isLoadingDocuments && <LoadingSpinner />}
            {!isLoadingDocuments && patientDocuments.length === 0 && <p>No documents uploaded for this patient yet.</p>}
            {!isLoadingDocuments && patientDocuments.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {patientDocuments.map(doc => (
                  <li key={doc.document_uuid} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {doc.original_filename} ({new Date(doc.upload_timestamp).toLocaleDateString()})
                    </span>
                    <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8em',
                        color: 'white',
                        backgroundColor: doc.processing_status === 'completed' ? 'green' :
                                         doc.processing_status === 'completed_empty_text' ? 'goldenrod' :
                                         doc.processing_status === 'failed' ? 'red' :
                                         'gray'
                    }}>
                      {doc.processing_status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {/* You could add a button to manually refresh the document list */}
            <button onClick={() => fetchPatientDocuments(currentPatientUuid.trim())} disabled={isLoadingDocuments || !currentPatientUuid} style={{marginTop: '10px'}}>
                Refresh Document List
            </button>
          </div>
          {errorMessage && errorMessage.includes("Failed to load documents:") && <ErrorMessage message={errorMessage} />}
        </section>
      )}
      
      {/* Main AI Processing Feedback and Results */}
      {isLoading && <LoadingSpinner />}
      {errorMessage && !errorMessage.includes("Failed to load documents:") && <ErrorMessage message={errorMessage} />}
      {apiResult && clinicalDetails && (
        <div className="clinical-support-results" style={{ marginTop: '20px' }}>
          <h2 style={{borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px'}}>AI Assistant Insights</h2>
          
          {/* Optional display of transcript and extracted info */}
          {apiResult.transcript && (
            <details style={{marginBottom: '10px'}} open> {/* Keep open by default */}
              <summary><strong>Consultation Transcript (Summary)</strong></summary>
              <p style={{maxHeight: '150px', overflowY: 'auto', background:'#f0f0f0', padding: '10px', border: '1px solid #ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                  {apiResult.transcript}
              </p>
            </details>
          )}
          {apiResult.extracted_clinical_info && Object.keys(apiResult.extracted_clinical_info).length > 0 && (
              <details style={{marginBottom: '20px'}} open> {/* Keep open by default */}
                  <summary><strong>Extracted Clinical Information (from transcript)</strong></summary>
                  <pre style={{maxHeight: '200px', overflowY: 'auto', background:'#f0f0f0', padding: '10px', border: '1px solid #ddd', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                      {JSON.stringify(apiResult.extracted_clinical_info, null, 2)}
                  </pre>
              </details>
          )}
          {apiResult.manual_context_provided && (
            <div style={{marginBottom: '20px', padding: '10px', background: '#e9ecef', border: '1px solid #ced4da', borderRadius: '5px'}}>
                <strong>Manually Entered Context by Doctor:</strong>
                <p style={{whiteSpace: 'pre-wrap'}}>{apiResult.manual_context_provided}</p>
            </div>
          )}


          <SummaryDisplay summary={clinicalDetails.differential_summary_for_doctor} />
          <PotentialConditionsDisplay conditions={clinicalDetails.potential_conditions} />
          <SuggestedInvestigationsDisplay investigations={clinicalDetails.suggested_investigations} />
          <MedicationConsiderationsDisplay considerations={clinicalDetails.medication_considerations_info} />
          <AlertsFlagsDisplay alerts={clinicalDetails.alerts_and_flags} />
        </div>
      )}


      {(apiResult || (errorMessage && !errorMessage.includes("Failed to load documents:"))) && !isLoading && (
        <button onClick={startNewConsultation} style={{ marginTop: '30px', padding: '12px 25px', fontSize: '1.1em', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Start New Consultation / Clear Results
        </button>
      )}
    </main>
    </div>
  );
}