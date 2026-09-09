'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StoreNotice } from '@/types/header';

export const STORE_NOTICES: StoreNotice[] = [
  {
    id: 'notice-delivery-operational',
    message: 'Delivery Alert: Home delivery operational across Malda. Counter pickup free at Netaji Subhash Road.',
    messageBn: '📢 আবহাওয়া ও ডেলিভারি আপডেট: মালদা জেলা জুড়ে ডেলিভারি সচল — নেতাজি সুভাষ রোড কাউন্টার থেকে ফ্রি সংগ্রহ করতে পারেন।',
    type: 'emergency',
    isActive: true,
    linkText: 'কাউন্টার লোকেশন ➔',
    linkUrl: '#location',
  },
  {
    id: 'notice-flat-shipping-50',
    message: 'Flat India Post Delivery at only ₹50 across all 23 districts of West Bengal!',
    messageBn: '🔥 পশ্চিমবঙ্গ জুড়ে মাত্র ৫০ টাকায় India Post ডেলিভারি — ঘরে বসেই যেকোনো সিলেবাসের বই পান!',
    type: 'offer',
    isActive: true,
    linkText: 'বিস্তারিত দেখুন ➔',
    linkUrl: '/offers',
  },
  {
    id: 'notice-wbcs-2026-stock',
    message: 'WBCS 2026 Edition Manuals & College Semesters (1-6) guides are now in stock!',
    messageBn: '📚 ডাব্লুবিসিএস ২০২৬ নতুন সংস্করণ ও কলেজ সেমিস্টার সহায়িকা এখন সম্পূর্ণ স্টকে উপলব্ধ।',
    type: 'offer',
    isActive: true,
    linkText: 'বইয়ের তালিকা ➔',
    linkUrl: '/category/wbcs',
  },
  {
    id: 'notice-bulk-orders-schools',
    message: 'Special bulk purchase discounts available for Schools, Madrashas & Coaching Centers.',
    messageBn: '🏫 স্কুল, মাদ্রাসা ও কোচিং সেন্টারের জন্য আকর্ষণীয় বাল্ক ছাড় ও স্পেশাল কোটেশন সুবিধা।',
    type: 'offer',
    isActive: true,
    linkText: 'কোটেশন রিকোয়েস্ট ➔',
    linkUrl: '#bulk',
  },
];

const STORAGE_KEY = 'mm_dismissed_notices_session';

export function useNoticeBar() {
  const [notices] = useState<StoreNotice[]>(STORE_NOTICES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check sessionStorage for session dismissal
  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem(STORAGE_KEY);
      if (isDismissed === 'true') {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Auto-rotate ticker every 5 seconds when visible and not paused
  useEffect(() => {
    if (!isVisible || isPaused || notices.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, isPaused, notices.length]);

  const nextNotice = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  }, [notices.length]);

  const prevNotice = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);
  }, [notices.length]);

  const dismissNotice = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const resetNotice = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsVisible(true);
  }, []);

  const currentNotice = notices[currentIndex] || notices[0];

  return {
    notices,
    currentNotice,
    currentIndex,
    totalNotices: notices.length,
    isVisible,
    isPaused,
    setIsPaused,
    nextNotice,
    prevNotice,
    dismissNotice,
    resetNotice,
  };
}
