import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, BASE } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const retries = useRef(0);

  const load = useCallback(async () => {
    const d = await api('/notifications');
    setNotifications(d.notifications);
    setUnread(d.unread);
  }, []);

  useEffect(() => {
    if (!user) { setNotifications([]); setUnread(0); return undefined; }
    load().catch(() => {});

    // live notifications via Socket.IO (JWT sent in the handshake)
    const socket = io(BASE || window.location.origin, { auth: (cb) => cb({ token: localStorage.getItem('cv_access') }) });
    socket.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((u) => u + 1);
      setToast(n.message);
      setTimeout(() => setToast(null), 5000);
    });
    socket.on('connect', () => { retries.current = 0; });
    socket.on('connect_error', async () => {
      // access token probably expired: refresh it through the API wrapper, then reconnect
      if (retries.current++ < 3) {
        try { await api('/auth/me'); socket.connect(); } catch { /* ignore */ }
      }
    });
    return () => socket.disconnect();
  }, [user, load]);

  const markAllRead = async () => {
    await api('/notifications/read-all', { method: 'PATCH' });
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };
  const markRead = async (id) => {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(u - 1, 0));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead, markRead }}>
      {children}
      {toast && <div className="toast" role="status">{toast}</div>}
    </NotificationContext.Provider>
  );
}
