import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId: req.user?._id };
    if (req.query.unread === 'true') {
      filter.readStatus = false;
    }

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId: req.user?._id, readStatus: false });
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
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

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { readStatus: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.user?._id, readStatus: false }, { readStatus: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

