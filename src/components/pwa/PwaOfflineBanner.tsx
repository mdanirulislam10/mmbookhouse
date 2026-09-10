'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/hooks/useLanguage';

interface PwaOfflineBannerProps {
  className?: string;
  forceOffline?: boolean;
}

/**
 * Task 48: PWA Offline Notification Bar
 * Informs the customer that the app is currently operating offline
 * and cached banners/books are being displayed.
 */
export const PwaOfflineBanner: React.FC<PwaOfflineBannerProps> = ({
  className = '',
  forceOffline = false,
}) => {
  const { isOffline } = useNetworkStatus();
  const { isBengali } = useLanguage();
  const activeOffline = forceOffline || isOffline;

  if (!activeOffline) return null;

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`w-full bg-[#37475a] text-white py-2 px-3 sm:px-4 rounded-lg shadow-md border border-gray-600/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-bengali transition-all duration-300 select-none ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-full bg-amber-500/20 text-amber-400">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-amber-300">
            {isBengali ? 'অফলাইন মোড সক্রিয়:' : 'Offline Mode Active:'}
          </span>{' '}
          <span className="text-gray-200">
            {isBengali
              ? 'ইন্টারনেট সংযোগ নেই। পূর্বে ক্যাশ করা ব্যানার ও বই দেখতে পাচ্ছেন।'
              : 'No internet connection. Showing cached banners and books.'}
          </span>
        </div>
      </div>

      <button
        onClick={handleRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#febd69] hover:bg-[#f3a847] text-gray-950 font-bold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>{isBengali ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
      </button>
    </aside>
  );
};
