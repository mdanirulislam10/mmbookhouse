'use client';

import { useState, useCallback } from 'react';
import { NotificationItem } from '@/types/header';

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

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      createdAt: 'এখন মাত্র',
      isRead: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
