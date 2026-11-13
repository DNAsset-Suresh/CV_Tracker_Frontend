import mongoose, { Schema, Document, Model } from 'mongoose';

export type DepartmentClassification = 'Advocate' | 'IT Development' | 'Field Executive';
export type RequirementStatus = 'Active' | 'On Hold' | 'Closed';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote';

export interface IRequirement extends Document {
  requirementId: string;
  title: string;
  department: DepartmentClassification;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number;
  maxExperience: number;
  relevantExperience: number;
  qualification: string;
  preferredLocation: string;
  vacancies: number;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  employmentType: EmploymentType;
  status: RequirementStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    requirementId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      enum: ['Advocate', 'IT Development', 'Field Executive'],
      required: [true, 'Department classification is required'],
      index: true,
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requiredSkills: {
      type: [String],
      default: [],
      index: true,
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    minExperience: {
      type: Number,
      default: 0,
    },
    maxExperience: {
      type: Number,
      default: 10,
    },
    relevantExperience: {
      type: Number,
      default: 0,
    },
    qualification: {
      type: String,
      default: 'Bachelor',
    },
    preferredLocation: {
      type: String,
      default: 'Any',
    },
    vacancies: {
      type: Number,
      default: 1,
      min: 1,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote'],
      default: 'Full-time',
    },
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Closed'],
      default: 'Active',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Requirement: Model<IRequirement> = mongoose.model<IRequirement>(
  'Requirement',
  RequirementSchema
);

