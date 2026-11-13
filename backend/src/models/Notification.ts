import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'resume_processed'
  | 'resume_failed'
  | 'candidate_assigned'
  | 'status_updated'
  | 'interview_scheduled'
  | 'requirement_update'
  | 'system';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  notificationType: NotificationType;
  entityType?: 'candidate' | 'resume' | 'assignment' | 'requirement' | 'interview';
  entityId?: mongoose.Types.ObjectId;
  readStatus: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    notificationType: {
      type: String,
      enum: [
        'resume_processed',
        'resume_failed',
        'candidate_assigned',
        'status_updated',
        'interview_scheduled',
        'requirement_update',
        'system',
      ],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['candidate', 'resume', 'assignment', 'requirement', 'interview'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    readStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

