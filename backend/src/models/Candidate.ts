import mongoose, { Schema, Document, Model } from 'mongoose';

export type RecruitmentStatus =
  | 'New'
  | 'Processing'
  | 'Needs Review'
  | 'Screened'
  | 'Unassigned'
  | 'Assigned'
  | 'Under Manager Review'
  | 'Shortlisted'
  | 'Rejected'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Selected'
  | 'On Hold'
  | 'Withdrawn';

export interface IEducation {
  highestQualification?: string | null;
  degree: string;
  institution: string;
  graduationYear?: number | null;
  grade?: string | null;
  fieldOfStudy?: string | null;
}

export interface IEmployment {
  company: string;
  designation: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  responsibilities?: string[];
}

export interface IStatusHistoryItem {
  previousStatus?: RecruitmentStatus;
  newStatus: RecruitmentStatus;
  updatedBy: mongoose.Types.ObjectId;
  comments?: string;
  timestamp: Date;
}

export interface IAuditItem {
  modifiedAt: Date;
  modifiedBy: mongoose.Types.ObjectId;
  field: string;
  previousValue: any;
  newValue: any;
}

export interface ICandidate extends Document {
  candidateId: string;
  personalInformation: {
    fullName: string;
    email?: string | null;
    phone?: string | null;
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
    previousCompanies?: string[] | null;
    employmentHistory?: IEmployment[];
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
  education: IEducation[];
  resumeId: mongoose.Types.ObjectId;
  primaryRequirementId?: mongoose.Types.ObjectId;
  assignedManagerId?: mongoose.Types.ObjectId;
  recruitmentStatus: RecruitmentStatus;
  statusHistory: IStatusHistoryItem[];
  extractionConfidence: number;
  isVerifiedByHR: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  hrReviewStatus?: 'Pending' | 'Suitable' | 'Not Suitable' | 'Needs Review';
  hrEvaluationNotes?: string;
  suitabilityDecision?: string;
  isArchived: boolean;
  auditHistory: IAuditItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    candidateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    personalInformation: {
      fullName: { type: String, required: true, trim: true, index: true },
      email: { type: String, default: null, trim: true, lowercase: true, index: true },
      phone: { type: String, default: null, trim: true, index: true },
      alternatePhone: { type: String, trim: true },
      currentLocation: { type: String, trim: true, index: true },
      currentAddress: { type: String },
      linkedIn: { type: String },
      portfolioUrl: { type: String },
    },
    professionalInformation: {
      totalExperienceYears: { type: Number, default: 0, index: true },
      totalExperienceMonths: { type: Number, default: 0 },
      relevantExperienceYears: { type: Number, default: 0, index: true },
      currentDesignation: { type: String, trim: true, index: true },
      previousDesignation: { type: String, trim: true },
      currentCompany: { type: String, trim: true },
      previousCompanies: { type: [String], default: [] },
      employmentHistory: [
        {
          company: { type: String },
          designation: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          isCurrent: { type: Boolean, default: false },
          responsibilities: { type: [String], default: [] },
        },
      ],
      professionalSummary: { type: String },
      noticePeriodDays: { type: Number },
      currentSalary: { type: String },
      expectedSalary: { type: String },
    },
    skills: {
      technicalSkills: { type: [String], default: [], index: true },
      programmingLanguages: { type: [String], default: [], index: true },
      frameworks: { type: [String], default: [], index: true },
      databases: { type: [String], default: [], index: true },
      tools: { type: [String], default: [] },
      softSkills: { type: [String], default: [] },
      domainSpecific: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
    },
    education: [
      {
        highestQualification: { type: String },
        degree: { type: String },
        institution: { type: String },
        graduationYear: { type: Number },
        grade: { type: String },
        fieldOfStudy: { type: String },
      },
    ],
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    primaryRequirementId: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      index: true,
    },
    assignedManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recruitmentStatus: {
      type: String,
      enum: [
        'New',
        'Processing',
        'Needs Review',
        'Screened',
        'Unassigned',
        'Assigned',
        'Under Manager Review',
        'Shortlisted',
        'Rejected',
        'Interview Scheduled',
        'Interview Completed',
        'Selected',
        'On Hold',
        'Withdrawn',
      ],
      default: 'Screened',
      index: true,
    },
    statusHistory: [
      {
        previousStatus: { type: String },
        newStatus: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        comments: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    extractionConfidence: {
      type: Number,
      default: 0.9,
    },
    isVerifiedByHR: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    hrReviewStatus: {
      type: String,
      enum: ['Pending', 'Suitable', 'Not Suitable', 'Needs Review'],
      default: 'Pending',
      index: true,
    },
    hrEvaluationNotes: {
      type: String,
      trim: true,
    },
    suitabilityDecision: {
      type: String,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    auditHistory: [
      {
        modifiedAt: { type: Date, default: Date.now },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        field: { type: String },
        previousValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound text search index for candidate search
CandidateSchema.index({
  'personalInformation.fullName': 'text',
  'personalInformation.email': 'text',
  'personalInformation.phone': 'text',
  'skills.technicalSkills': 'text',
  'skills.programmingLanguages': 'text',
  'professionalInformation.currentDesignation': 'text',
  'personalInformation.currentLocation': 'text',
});

export const Candidate: Model<ICandidate> = mongoose.model<ICandidate>(
  'Candidate',
  CandidateSchema
);

