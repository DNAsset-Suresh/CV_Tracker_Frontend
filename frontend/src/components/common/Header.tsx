import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User as UserIcon, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/notificationService';
import { ClassificationBadge } from './Badge';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readStatus: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    setUnreadCount(0);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Search Input */}
      <div className="relative w-96 hidden md:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search candidates, skills, requirements..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-4">
        {/* Real-time Socket Indicator */}
        <div
          title={isConnected ? 'Live sync connected' : 'Connecting to live service...'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        !n.readStatus ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            !n.readStatus ? 'text-teal-600' : 'text-slate-300'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span>{user?.role}</span>
                {user?.managerClassification && (
                  <span className="text-teal-600 font-medium">
                    • {user.managerClassification.replace(' Manager', '')}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in p-2">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                    {user?.role}
                  </span>
                  {user?.managerClassification && (
                    <ClassificationBadge classification={user.managerClassification} />
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

