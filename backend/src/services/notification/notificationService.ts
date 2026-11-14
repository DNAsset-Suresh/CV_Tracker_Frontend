import { Notification, INotification, NotificationType } from '../../models/Notification.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';

export class NotificationService {
  async sendNotification({
    userId,
    title,
    message,
    notificationType,
    entityType,
    entityId,
    metadata,
  }: {
    userId: mongoose.Types.ObjectId | string;
    title: string;
    message: string;
    notificationType: NotificationType;
    entityType?: 'candidate' | 'resume' | 'assignment' | 'requirement' | 'interview';
    entityId?: mongoose.Types.ObjectId | string;
    metadata?: Record<string, any>;
  }): Promise<INotification | null> {
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        notificationType,
        entityType,
        entityId,
        metadata,
        readStatus: false,
      });

      return notification;
    } catch (err: any) {
      logger.error(`[Notification Error] Could not create notification: ${err.message}`);
      return null;
    }
  }

  async broadcastToRole(_role: string, _title: string, _message: string, _meta?: any) {
    // Role-based notification broadcast via REST
  }
}

export const notificationService = new NotificationService();
