import { api } from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'HR' | 'Manager';
  managerClassification?: 'Advocate Manager' | 'IT Development Manager' | 'Field Executive Manager' | null;
  accountStatus: 'Active' | 'Inactive';
  phone?: string;
  lastLoginAt?: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('talentflow_token');
      localStorage.removeItem('talentflow_user');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, newPassword });
    return response.data;
  },
};

