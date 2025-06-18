import api from '../api';

export const userService = {
  // Get logged in user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/user/me');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create admin user
  createAdmin: async (userData) => {
    const response = await api.post('/user', userData);
    return response.data;
  },

  // Register consultant/doctor/health worker
  registerConsultant: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Create organization with admin user
  createOrganizationWithAdmin: async (orgData) => {
    const response = await api.post('/organization/with-root-user', orgData);
    return response.data;
  },

  // Update user
  updateUser: async (userData) => {
    const response = await api.put('/user', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.patch('/auth/update-password', passwordData);
    return response.data;
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/user/profile', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/user/change-password', passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get users in the current user's organization
  getOrganizationUsers: async () => {
    const response = await api.get('/user/organization');
    return response.data;
  }
}; 