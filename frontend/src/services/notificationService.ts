import { api } from './api';

export const notificationService = {
  getNotifications: async (unreadOnly: boolean = false) => {
    const response = await api.get('/notifications', {
      params: { unread: unreadOnly ? 'true' : undefined },
    });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

