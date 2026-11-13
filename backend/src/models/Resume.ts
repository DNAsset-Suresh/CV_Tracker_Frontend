import mongoose, { Schema, Document, Model } from 'mongoose';

export type ResumeProcessingStatus =
  | 'Uploaded'
  | 'Queued'
  | 'Processing'
  | 'Extracted'
  | 'Needs Review'
  | 'Failed'
  | 'Duplicate';

export interface IResume extends Document {
  candidateId?: mongoose.Types.ObjectId;
  originalFileName: string;
  storageKey?: string;
  storageUrl?: string;
  mimeType: string;
  fileSize: number;
  fileHash?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadBatchId?: string;
  processingStatus: ResumeProcessingStatus;
  rawExtractedText?: string;
  extractionMetadata?: {
    durationMs?: number;
    confidenceScore?: number;
    provider?: string;
    tokenCount?: number;
    method?: 'pdf' | 'docx' | 'ocr' | 'fallback';
  };
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      default: 'ephemeral_deleted',
    },
    storageUrl: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadBatchId: {
      type: String,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: [
        'Uploaded',
        'Queued',
        'Processing',
        'Extracted',
        'Needs Review',
        'Failed',
        'Duplicate',
      ],
      default: 'Uploaded',
      index: true,
    },
    rawExtractedText: {
      type: String,
    },
    extractionMetadata: {
      durationMs: { type: Number },
      confidenceScore: { type: Number },
      provider: { type: String, default: 'TalentFlow Rule-Based Parser' },
      tokenCount: { type: Number },
      method: { type: String, enum: ['pdf', 'docx', 'ocr', 'fallback'] },
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Resume: Model<IResume> = mongoose.model<IResume>('Resume', ResumeSchema);
