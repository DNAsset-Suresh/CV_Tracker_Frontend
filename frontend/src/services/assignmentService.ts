import { api } from './api';

export const assignmentService = {
  createAssignment: async (payload: {
    candidateId: string;
    requirementId: string;
    managerId: string;
    notes?: string;
    interviewDate?: string;
    interviewTime?: string;
  }) => {
    const response = await api.post('/assignments', payload);
    return response.data;
  },

  getAssignments: async (params?: Record<string, any>) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  getAssignmentById: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const response = await api.patch(`/assignments/${id}/status`, { status, note });
    return response.data;
  },
};

