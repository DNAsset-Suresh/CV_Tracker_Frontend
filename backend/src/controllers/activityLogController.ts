import { Response } from 'express';
import { ActivityLog } from '../models/ActivityLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const { action, entityType, userId, search } = req.query;
    const filter: any = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

