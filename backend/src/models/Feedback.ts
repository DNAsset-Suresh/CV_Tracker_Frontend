import mongoose, { Schema, Document, Model } from 'mongoose';

export type EvaluationStatus = 'Shortlist' | 'Reject' | 'Hold' | 'Recommend Next Round';

export interface IFeedback extends Document {
  candidateId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  ratings?: {
    technicalSkills?: number;
    communication?: number;
    relevantExperience?: number;
    culturalFit?: number;
    overall?: number;
  };
  evaluationStatus: EvaluationStatus;
  comments: string;
  strengths?: string[];
  weaknesses?: string[];
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ratings: {
      technicalSkills: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      relevantExperience: { type: Number, min: 1, max: 5 },
      culturalFit: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
    },
    evaluationStatus: {
      type: String,
      enum: ['Shortlist', 'Reject', 'Hold', 'Recommend Next Round'],
      required: true,
      index: true,
    },
    comments: {
      type: String,
      required: [true, 'Feedback comments are required'],
      trim: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback: Model<IFeedback> = mongoose.model<IFeedback>(
  'Feedback',
  FeedbackSchema
);

