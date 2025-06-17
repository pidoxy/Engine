import axios from 'axios';

// Separate instance for the AI backend
const AIDCARE_API_BASE_URL = process.env.NEXT_PUBLIC_AIDCARE_API_BASE_URL || 'http://localhost:8001';

const aidcareApi = axios.create({
  baseURL: AIDCARE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aidcareService = {
  // Health check
  healthCheck: async () => {
    const response = await aidcareApi.get('/health');
    return response.data;
  },

  // Create patient in AI backend (sync with main backend)
  createPatient: async (patientData) => {
    const response = await aidcareApi.post('/patients/', patientData);
    return response.data;
  },

  // Get patient by UUID
  getPatientByUuid: async (patientUuid) => {
    const response = await aidcareApi.get(`/patients/${patientUuid}`);
    return response.data;
  },

  // Get all patients
  getAllPatients: async (skip = 0, limit = 20) => {
    const response = await aidcareApi.get(`/patients/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Transcribe audio only
  transcribeAudio: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    
    const response = await aidcareApi.post('/transcribe/audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process text for triage
  processTextForTriage: async (patientUuid, transcriptText) => {
    const response = await aidcareApi.post(`/triage/process_text/${patientUuid}`, {
      transcript_text: transcriptText,
    });
    return response.data;
  },

  // Process audio for triage
  processAudioForTriage: async (patientUuid, audioFile, manualContext = '') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('manual_context', manualContext);
    
    const response = await aidcareApi.post(`/triage/process_audio/${patientUuid}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process consultation for clinical support
  processConsultationForClinicalSupport: async (patientUuid, audioFile, manualContext = '') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('manual_context', manualContext);
    
    const response = await aidcareApi.post(`/clinical_support/process_consultation/${patientUuid}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload patient document
  uploadPatientDocument: async (patientUuid, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await aidcareApi.post(`/patients/${patientUuid}/upload_document/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // List patient documents
  listPatientDocuments: async (patientUuid, limit = 10) => {
    const response = await aidcareApi.get(`/patients/${patientUuid}/documents/?limit=${limit}`);
    return response.data;
  },

  // List patient consultations
  listPatientConsultations: async (patientUuid, limit = 5) => {
    const response = await aidcareApi.get(`/patients/${patientUuid}/consultations/?limit=${limit}`);
    return response.data;
  },
}; 