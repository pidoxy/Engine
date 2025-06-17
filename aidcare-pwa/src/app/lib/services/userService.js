import api from '../api';

export const userService = {
  // Get logged in user
  getCurrentUser: async () => {
    const response = await api.get('/api/v1/user/me');
    return response.data;
  },

  // Create admin user
  createAdmin: async (userData) => {
    const response = await api.post('/api/v1/user', userData);
    return response.data;
  },

  // Register consultant
  registerConsultant: async (userData) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userData) => {
    const response = await api.put('/api/v1/user', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, passwordData) => {
    const response = await api.post(`/api/v1/auth/reset-password/${token}`, passwordData);
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/api/v1/users');
    return response.data;
  },

  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.patch('/api/v1/auth/update-password', passwordData);
    return response.data;
  },
}; 