import { api } from './api';

export const requirementService = {
  getRequirements: async (params?: Record<string, any>) => {
    const response = await api.get('/requirements', { params });
    return response.data;
  },

  getRequirementById: async (id: string) => {
    const response = await api.get(`/requirements/${id}`);
    return response.data;
  },

  createRequirement: async (reqData: any) => {
    const response = await api.post('/requirements', reqData);
    return response.data;
  },

  updateRequirement: async (id: string, reqData: any) => {
    const response = await api.put(`/requirements/${id}`, reqData);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/requirements/${id}/status`, { status });
    return response.data;
  },
};

