'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NotificationItem } from '@/types/header';

const STORAGE_KEY = 'mm-bookhouse-notifications';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '📦 পার্সেল প্যাকিং সম্পন্ন হয়েছে',
    message: 'আপনার WBCS প্র্যাকটিস সেট (২০২৬ সংস্করণ) অর্ডারটি সফলভাবে প্যাক করা হয়েছে এবং কুরিয়ার ডেলিভারির অপেক্ষায়।',
    type: 'order_status',
    createdAt: '১০ মিনিট আগে',
    isRead: false,
    badgeText: 'অর্ডার আপডেট',
  },
  {
    id: 'notif-2',
    title: '🔔 পছন্দের বই স্টকে ফিরেছে!',
    message: 'আপনার উইশলিস্টের বই "ভারতের ইতিহাস ও জাতীয় মুক্তি সংগ্রাম" (রমেশচন্দ্র মজুমদার) পুনরায় স্টকে এসেছে।',
    type: 'stock_alert',
    createdAt: '১ ঘণ্টা আগে',
    isRead: false,
    badgeText: 'স্টক অ্যালার্ট',
  },
  {
    id: 'notif-3',
    title: '🔥 কলেজ সেমিস্টার স্পেশাল ছাড়',
    message: 'গৌড়বঙ্গ বিশ্ববিদ্যালয়ের স্নাতক ও স্নাতকোত্তর রেফারেন্স বইয়ে আজ ফ্ল্যাট ১৫% ক্যাশব্যাক ছাড়।',
    type: 'deal',
    createdAt: 'আজ সকালে',
    isRead: true,
    badgeText: 'অফার',
  },
];

interface NotificationsStore {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,

      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      addNotification: (item) => {
        const newItem: NotificationItem = {
          ...item,
          id: `notif-${Date.now()}`,
          createdAt: 'এখন মাত্র',
          isRead: false,
        };
        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }));
      },

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Atomic Selectors for Task 48 (Zustand Performance & Optimization)
export const useUnreadNotificationsCount = () =>
  useNotificationsStore((state) => state.notifications.filter((n) => !n.isRead).length);

export const useNotificationsList = () =>
  useNotificationsStore((state) => state.notifications);

/**
 * Backward-compatible hook for components
 */
export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const addNotification = useNotificationsStore((state) => state.addNotification);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
