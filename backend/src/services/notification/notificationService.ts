import { Server as SocketServer } from 'socket.io';
import { Notification, INotification, NotificationType } from '../../models/Notification.js';
import { logger } from '../../utils/logger.js';
import mongoose from 'mongoose';

let ioInstance: SocketServer | null = null;

export const setSocketIOInstance = (io: SocketServer) => {
  ioInstance = io;
  logger.info('[Socket.IO] Notification service bound to Socket server.');
};

export const getSocketIOInstance = (): SocketServer | null => ioInstance;

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

      // Emit real-time notification to user's room if socket server is active
      if (ioInstance) {
        ioInstance.to(userId.toString()).emit('new_notification', notification);
        // Also broadcast global event for dashboard stats updates
        ioInstance.emit('recruitment_event', {
          type: notificationType,
          entityId,
          title,
        });
      }

      return notification;
    } catch (err: any) {
      logger.error(`[Notification Error] Could not create notification: ${err.message}`);
      return null;
    }
  }

  async broadcastToRole(role: string, title: string, message: string, meta?: any) {
    if (ioInstance) {
      ioInstance.to(role).emit('broadcast_alert', { title, message, meta });
    }
  }
}

export const notificationService = new NotificationService();

