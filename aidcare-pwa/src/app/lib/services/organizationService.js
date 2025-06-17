import api from '../api';

export const organizationService = {
  // Get all organizations
  getAllOrganizations: async () => {
    const response = await api.get('/api/v1/organization');
    return response.data;
  },

  // Create organization
  createOrganization: async (organizationData) => {
    const response = await api.post('/api/v1/organization', organizationData);
    return response.data;
  },

  // Create organization with root user
  createOrganizationWithRootUser: async (orgData) => {
    const response = await api.post('/api/v1/organization/with-root-user', orgData);
    return response.data;
  },

  // Get organization by ID
  getOrganizationById: async (organizationId) => {
    const response = await api.get(`/api/v1/organization/${organizationId}`);
    return response.data;
  },

  // Update organization
  updateOrganization: async (organizationId, organizationData) => {
    const response = await api.put(`/api/v1/organization/${organizationId}`, organizationData);
    return response.data;
  },

  // Delete organization
  deleteOrganization: async (organizationId) => {
    const response = await api.delete(`/api/v1/organization/${organizationId}`);
    return response.data;
  },
}; 