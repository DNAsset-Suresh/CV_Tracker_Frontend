import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  ActivityLogSchema
);

