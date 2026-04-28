import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const typeIcons = {
    referral: '🤝',
    bonus: '🎁',
    prize: '🏆',
    system: '📢',
    match: '♟️',
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-hero flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-chess-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-hero px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-400 mt-1">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-chess-green font-medium hover:text-emerald-400 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-slate-400 font-medium">No notifications yet</p>
            <p className="text-slate-500 text-sm mt-1">
              You'll see match results, bonuses, and updates here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.read && markOneRead(notif._id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-navy-800/30 border-navy-700/20'
                    : 'bg-navy-800/60 border-chess-green/20 hover:border-chess-green/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-700/50 flex items-center justify-center text-xl flex-shrink-0">
                    {typeIcons[notif.type] || '📬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${notif.read ? 'text-slate-400' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-chess-green rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${notif.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
