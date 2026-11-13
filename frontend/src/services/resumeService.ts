import { api } from './api';

export const resumeService = {
  uploadSingle: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadBulk: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('resumes', file));
    const response = await api.post('/resumes/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getResumes: async (params?: Record<string, any>) => {
    const response = await api.get('/resumes', { params });
    return response.data;
  },

  getBatchStatus: async (batchId: string) => {
    const response = await api.get(`/resumes/batch/${batchId}`);
    return response.data;
  },

  getResumeStatus: async (id: string) => {
    const response = await api.get(`/resumes/${id}/status`);
    return response.data;
  },

  retryResume: async (id: string) => {
    const response = await api.post(`/resumes/${id}/retry`);
    return response.data;
  },
};

