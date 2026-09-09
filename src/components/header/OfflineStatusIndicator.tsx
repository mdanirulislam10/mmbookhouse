'use client';

import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/hooks/useLanguage';

interface OfflineStatusIndicatorProps {
  className?: string;
  forceOffline?: boolean; // For manual testing in test console
}

/**
 * Module 2 (Task 37): Header Offline Status Indicator
 *
 * Automatically displays a slim high-visibility strip beneath the header
 * whenever the customer's internet connection drops, and a brief green strip when restored.
 */
export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  className = '',
  forceOffline = false,
}) => {
  const { isOffline, isReconnected } = useNetworkStatus();
  const { isBengali } = useLanguage();

  const activeOffline = forceOffline || isOffline;

  if (!activeOffline && !isReconnected) {
    return null;
  }

  if (activeOffline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`w-full bg-red-600 text-white py-1.5 px-3 text-xs flex items-center justify-center gap-2 font-semibold shadow-md transition-all duration-200 select-none ${className}`}
      >
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-white" />
        <span>
          {isBengali
            ? '⚠️ আপনি অফলাইনে আছেন — অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।'
            : '⚠️ You are currently offline — please check your internet connection.'}
        </span>
      </div>
    );
  }

  if (isReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full bg-emerald-600 text-white py-1 px-3 text-xs flex items-center justify-center gap-2 font-semibold shadow-md transition-all duration-200 select-none ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
        <span>
          {isBengali
            ? '✓ ইন্টারনেট সংযোগ পুনরায় স্থাপিত হয়েছে।'
            : '✓ Internet connection restored.'}
        </span>
      </div>
    );
  }

  return null;
};
