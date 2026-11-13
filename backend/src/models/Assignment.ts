import mongoose, { Schema, Document, Model } from 'mongoose';

export type AssignmentStatus =
  | 'Assigned'
  | 'Under Review'
  | 'Shortlisted'
  | 'Rejected'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Withdrawn';

export interface IAssignmentHistory {
  status: AssignmentStatus;
  updatedBy: mongoose.Types.ObjectId;
  note?: string;
  timestamp: Date;
}

export interface IAssignment extends Document {
  assignmentId: string;
  candidateId: mongoose.Types.ObjectId;
  requirementId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignmentStatus: AssignmentStatus;
  assignedAt: Date;
  notes?: string;
  interviewDate?: string;
  interviewTime?: string;
  history: IAssignmentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    assignmentId: {
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
    requirementId: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: [
        'Assigned',
        'Under Review',
        'Shortlisted',
        'Rejected',
        'Interview Scheduled',
        'Selected',
        'Withdrawn',
      ],
      default: 'Assigned',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    interviewDate: {
      type: String,
      trim: true,
    },
    interviewTime: {
      type: String,
      trim: true,
    },
    history: [
      {
        status: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active assignments for the same candidate and requirement
AssignmentSchema.index({ candidateId: 1, requirementId: 1 }, { unique: false });

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>(
  'Assignment',
  AssignmentSchema
);

