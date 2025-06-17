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
}; 