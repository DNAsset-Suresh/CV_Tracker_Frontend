import { api } from './api';

export const aiService = {
  reExtractResume: async (resumeId: string) => {
    const response = await api.post(`/ai/extract/${resumeId}`);
    return response.data;
  },

  matchCandidateWithRequirement: async (candidateId: string, requirementId: string) => {
    const response = await api.post(`/ai/match/${candidateId}/${requirementId}`);
    return response.data;
  },

  getMatchResult: async (candidateId: string, requirementId: string) => {
    const response = await api.get(`/ai/match/${candidateId}/${requirementId}`);
    return response.data;
  },
};

