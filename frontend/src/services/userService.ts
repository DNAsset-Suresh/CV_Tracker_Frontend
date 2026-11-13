import { api } from './api';

export const userService = {
  getUsers: async (params?: Record<string, any>) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  toggleUserStatus: async (id: string) => {
    const response = await api.patch(`/users/${id}/status`);
    return response.data;
  },

  resetUserPassword: async (id: string, newPassword: string) => {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getManagers: async () => {
    const response = await api.get('/users/managers');
    return response.data;
  },

  getManagersByClassification: async (department?: string) => {
    const response = await api.get('/users/managers', { params: { department } });
    return response.data;
  },
};

