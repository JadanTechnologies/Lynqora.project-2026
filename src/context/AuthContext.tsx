import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AppNotification } from '../types.ts';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('lynqora_jwt');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = token || localStorage.getItem('lynqora_jwt');
    if (!savedToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchNotifications(savedToken);
      } else {
        // Token invalid or expired
        localStorage.removeItem('lynqora_jwt');
        setToken(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to verify session', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, fetchNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = false): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      localStorage.setItem('lynqora_jwt', data.token);
      setCurrentUser(data.user);
      fetchNotifications(data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      localStorage.setItem('lynqora_jwt', data.token);
      setCurrentUser(data.user);
      fetchNotifications(data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const savedToken = token || localStorage.getItem('lynqora_jwt');
    if (savedToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${savedToken}` }
        });
      } catch (e) {
        // Ignore logout network errors
      }
    }
    localStorage.removeItem('lynqora_jwt');
    setToken(null);
    setCurrentUser(null);
    setNotifications([]);
  };

  const markNotificationRead = async (id: string) => {
    const savedToken = token || localStorage.getItem('lynqora_jwt');
    if (!savedToken) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${savedToken}` }
      });
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  const markAllNotificationsRead = async () => {
    const savedToken = token || localStorage.getItem('lynqora_jwt');
    if (!savedToken) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${savedToken}` }
      });
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{
      currentUser,
      token,
      isLoading,
      isAdmin,
      isSuperAdmin,
      notifications,
      unreadCount,
      login,
      register,
      logout,
      refreshUser,
      markNotificationRead,
      markAllNotificationsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
