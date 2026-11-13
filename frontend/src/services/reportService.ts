import { api } from './api';

export const reportService = {
  getAdminReports: async () => {
    const response = await api.get('/reports/admin');
    return response.data;
  },

  getHRReports: async () => {
    const response = await api.get('/reports/hr');
    return response.data;
  },

  getManagerReports: async () => {
    const response = await api.get('/reports/manager');
    return response.data;
  },
};

