import mongoose, { Schema, Document, Model } from 'mongoose';

export type InterviewType = 'Technical' | 'Managerial' | 'HR' | 'Client' | 'Final';
export type InterviewMode = 'Virtual' | 'In-Person' | 'Telephonic';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface IInterview extends Document {
  interviewId: string;
  candidateId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  requirementId: mongoose.Types.ObjectId;
  interviewDate: Date;
  interviewType: InterviewType;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  interviewer: string;
  interviewStatus: InterviewStatus;
  feedback?: string;
  rating?: number;
  scheduledBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    interviewId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
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
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true,
    },
    interviewDate: {
      type: Date,
      required: true,
      index: true,
    },
    interviewType: {
      type: String,
      enum: ['Technical', 'Managerial', 'HR', 'Client', 'Final'],
      default: 'Technical',
    },
    mode: {
      type: String,
      enum: ['Virtual', 'In-Person', 'Telephonic'],
      default: 'Virtual',
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    interviewer: {
      type: String,
      required: true,
      trim: true,
    },
    interviewStatus: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled',
      index: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    scheduledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Interview: Model<IInterview> = mongoose.model<IInterview>(
  'Interview',
  InterviewSchema
);

