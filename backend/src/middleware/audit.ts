import { ActivityLog } from '../models/ActivityLog.js';
import { AuthenticatedRequest } from './auth.js';

export const logActivity = async (
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>,
  previousValue?: any,
  newValue?: any
) => {
  try {
    await ActivityLog.create({
      userId: req.user?._id,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      details,
      ipAddress: req.ip || req.socket.remoteAddress,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('[Audit Log Error]', error.message);
  }
};

