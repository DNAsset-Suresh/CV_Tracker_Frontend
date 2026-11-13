import { api } from './api';

export const candidateService = {
  getCandidates: async (params?: Record<string, any>) => {
    const response = await api.get('/candidates', { params });
    return response.data;
  },

  getCandidateById: async (id: string) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  updateCandidate: async (id: string, data: any) => {
    const response = await api.put(`/candidates/${id}`, data);
    return response.data;
  },

  verifyCandidate: async (id: string) => {
    const response = await api.patch(`/candidates/${id}/verify`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, comments?: string) => {
    const response = await api.patch(`/candidates/${id}/status`, { status, comments });
    return response.data;
  },

  getResumeUrl: async (id: string) => {
    const response = await api.get(`/candidates/${id}/resume`);
    return response.data;
  },

  deleteCandidate: async (id: string) => {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
  },

  archiveCandidate: async (id: string) => {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
  },

  exportCSVUrl: () => {
    const token = localStorage.getItem('talentflow_token');
    return `/api/candidates/export/csv?token=${token}`;
  },
};

