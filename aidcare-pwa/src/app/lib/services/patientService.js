import api from '../api';

export const patientService = {
  // Create a patient
  createPatient: async (patientData) => {
    const response = await api.post('/api/v1/patients', patientData);
    return response.data;
  },

  // Get patient by ID
  getPatientById: async (patientId) => {
    const response = await api.get(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  // Get patient single consultation
  getPatientConsultation: async (patientId, consultationId) => {
    const response = await api.get(`/api/v1/patients/${patientId}/consultation/${consultationId}`);
    return response.data;
  },

  // Get all active patients in organization
  getOrganizationPatients: async () => {
    const response = await api.get('/api/v1/patients/organization');
    return response.data;
  },

  // Create patient with medical documents (AI backend)
  createPatientWithDocuments: async (patientData, medicalFiles = []) => {
    const formData = new FormData();
    
    // Add patient data as form fields
    formData.append('patient_uuid', patientData.id || crypto.randomUUID());
    if (patientData.firstName) formData.append('first_name', patientData.firstName);
    if (patientData.lastName) formData.append('last_name', patientData.lastName);
    if (patientData.dateOfBirth) formData.append('date_of_birth_str', patientData.dateOfBirth);
    if (patientData.gender) formData.append('gender', patientData.gender);
    if (patientData.phoneNumber) formData.append('phone_number', patientData.phoneNumber);
    if (patientData.address) formData.append('address', patientData.address);
    if (patientData.emergencyContact) formData.append('emergency_contact', patientData.emergencyContact);
    if (patientData.emergencyContactPhone) formData.append('emergency_contact_phone', patientData.emergencyContactPhone);
    if (patientData.medicalHistory) formData.append('medical_history', patientData.medicalHistory);
    if (patientData.allergies) formData.append('allergies', patientData.allergies);
    if (patientData.currentMedications) formData.append('current_medications', patientData.currentMedications);
    
    // Add medical documents
    medicalFiles.forEach(fileData => {
      formData.append('medical_documents', fileData.file);
    });
    
    const AI_BACKEND_URL = 'http://localhost:8000';
    const response = await fetch(`${AI_BACKEND_URL}/patients/create_with_documents/`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create patient with documents');
    }
    
    return await response.json();
  },
}; 