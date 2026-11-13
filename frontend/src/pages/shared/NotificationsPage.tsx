import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            System updates, candidate assignments, and recruitment pipeline events.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications at this time.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkRead(n._id)}
              className={`p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                !n.readStatus ? 'bg-teal-50/20' : ''
              }`}
            >
              <div className="mt-1">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    !n.readStatus ? 'text-teal-600' : 'text-slate-300'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

