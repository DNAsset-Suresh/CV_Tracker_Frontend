export interface IExtractedCandidateData {
  personalInformation: {
    fullName: string;
    email: string;
    phone: string;
    alternatePhone?: string | null;
    currentLocation?: string | null;
    currentAddress?: string | null;
    linkedIn?: string | null;
    portfolioUrl?: string | null;
  };
  professionalInformation: {
    totalExperienceYears: number;
    totalExperienceMonths: number;
    relevantExperienceYears: number;
    currentDesignation?: string | null;
    previousDesignation?: string | null;
    currentCompany?: string | null;
    previousCompanies?: string[];
    employmentHistory?: Array<{
      company: string;
      designation: string;
      startDate?: string;
      endDate?: string;
      isCurrent?: boolean;
      responsibilities?: string[];
    }>;
    professionalSummary?: string | null;
    noticePeriodDays?: number | null;
    currentSalary?: string | null;
    expectedSalary?: string | null;
  };
  skills: {
    technicalSkills: string[];
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    softSkills: string[];
    domainSpecific: string[];
    certifications: string[];
  };
  education: Array<{
    highestQualification?: string | null;
    degree: string;
    institution: string;
    graduationYear?: number | null;
    grade?: string | null;
    fieldOfStudy?: string | null;
  }>;
  suggestedDepartment?: 'Advocate' | 'IT Development' | 'Field Executive';
  confidenceScore: number;
  provider: string;
}

export interface IMatchEvaluation {
  overallScore: number;
  skillsMatch: {
    matched: string[];
    missing: string[];
    partial: string[];
  };
  experienceMatch: {
    requiredMin: number;
    requiredMax: number;
    candidateTotal: number;
    candidateRelevant: number;
    isMatch: boolean;
    score: number;
  };
  educationMatch: {
    required: string;
    candidateHighest: string;
    isMatch: boolean;
    score: number;
  };
  strengths: string[];
  potentialGaps: string[];
  explanation: string;
  recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
}

export interface ExtractionServiceInterface {
  extractCandidateData(resumeText: string, fileName: string): Promise<IExtractedCandidateData>;
  evaluateRequirementMatch(candidate: any, requirement: any): Promise<IMatchEvaluation>;
}
