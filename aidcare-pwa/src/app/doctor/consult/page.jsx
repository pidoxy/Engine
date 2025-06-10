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

export default function ClinicalSupportPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualContext, setManualContext] = useState(''); 
  const [currentPatientUuid, setCurrentPatientUuid] = useState("test-patient-123"); 
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
            onChange={(e) => {
              setCurrentPatientUuid(e.target.value);
              // When UUID changes, existing consultation results are no longer valid for the new patient
              setApiResult(null); 
                setErrorMessage('');
            } }
            placeholder="Enter Patient UUID"
            style={{padding: "5px"}}
            disabled={isLoading || isRecording}
          />
        </div>
      </header>

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
  );
}