'use client';

import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';

interface GuestCartBadgeProps {
  className?: string;
  variant?: 'subtle' | 'banner' | 'pill';
}

/**
 * Task 22: 100% Open Guest Browsing & Guest Cart Assurance Badge
 * Confirms to customers that they can freely browse and add books to cart without forced login.
 */
export const GuestCartBadge: React.FC<GuestCartBadgeProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { isLoggedIn } = useAuthSession();

  // If customer is already logged in, no need to show guest badge
  if (isLoggedIn) return null;

  if (variant === 'banner') {
    return (
      <div
        className={`bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-950 font-bengali shadow-xs ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 leading-snug">
            ১০০% উন্মুক্ত গেস্ট ব্রাউজিং সক্রিয়
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-tight">
            লগইনের কোনো ঝামেলা ছাড়াই ইচ্ছামতো বই কার্টে যোগ করুন। কেবল ফাইনাল অর্ডারের সময় ওটিপি দিলেই চলবে।
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'subtle') {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium font-bengali ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>লগইন ছাড়াই কার্টে যোগ করা যাবে</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/70 text-emerald-800 rounded-full text-[11px] font-bold font-bengali select-none shadow-2xs ${className}`}
      title="পাসওয়ার্ড ছাড়াই বই কার্টে যোগ করুন"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>গেস্ট কার্ট সক্রিয় • লগইন ছাড়াই ব্রাউজ করুন</span>
    </div>
  );
};
