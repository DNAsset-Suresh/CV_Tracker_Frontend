import mongoose, { Schema, Document, Model } from 'mongoose';

export type MatchRecommendation = 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';

export interface IMatchResult extends Document {
  candidateId: mongoose.Types.ObjectId;
  requirementId: mongoose.Types.ObjectId;
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
  recommendation: MatchRecommendation;
  computedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchResultSchema = new Schema<IMatchResult>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    skillsMatch: {
      matched: { type: [String], default: [] },
      missing: { type: [String], default: [] },
      partial: { type: [String], default: [] },
    },
    experienceMatch: {
      requiredMin: { type: Number, default: 0 },
      requiredMax: { type: Number, default: 0 },
      candidateTotal: { type: Number, default: 0 },
      candidateRelevant: { type: Number, default: 0 },
      isMatch: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
    },
    educationMatch: {
      required: { type: String, default: '' },
      candidateHighest: { type: String, default: '' },
      isMatch: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
    },
    strengths: {
      type: [String],
      default: [],
    },
    potentialGaps: {
      type: [String],
      default: [],
    },
    explanation: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
      enum: ['Strong Match', 'Good Match', 'Moderate Match', 'Low Match'],
      required: true,
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find match result for a candidate and requirement
MatchResultSchema.index({ candidateId: 1, requirementId: 1 }, { unique: true });

export const MatchResult: Model<IMatchResult> = mongoose.model<IMatchResult>(
  'MatchResult',
  MatchResultSchema
);

