import { api } from './api';

export const managerService = {
  getDashboard: async () => {
    const response = await api.get('/manager/dashboard');
    return response.data;
  },

  getCandidates: async (params?: Record<string, any>) => {
    const response = await api.get('/manager/candidates', { params });
    return response.data;
  },

  getAssignedCandidates: async (params?: Record<string, any>) => {
    const response = await api.get('/manager/candidates', { params });
    return response.data;
  },

  getCandidateEvaluationDetails: async (candidateId: string) => {
    const response = await api.get(`/manager/candidates/${candidateId}/evaluate`);
    return response.data;
  },

  getEvaluations: async (params?: Record<string, any>) => {
    const response = await api.get('/manager/evaluations', { params });
    return response.data;
  },

  submitFeedback: async (feedbackData: {
    candidateId: string;
    assignmentId: string;
    evaluationStatus: 'Shortlist' | 'Reject' | 'Hold' | 'Recommend Next Round';
    comments: string;
    ratings?: Record<string, number>;
    strengths?: string[];
    weaknesses?: string[];
    rejectionReason?: string;
  }) => {
    const response = await api.post('/manager/feedback', feedbackData);
    return response.data;
  },

  scheduleInterview: async (interviewData: {
    candidateId: string;
    assignmentId: string;
    requirementId: string;
    interviewDate: string;
    interviewType?: string;
    mode?: string;
    meetingLink?: string;
    location?: string;
    interviewer?: string;
  }) => {
    const response = await api.post('/manager/interview', interviewData);
    return response.data;
  },
};

