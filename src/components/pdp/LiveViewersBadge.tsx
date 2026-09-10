'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { usePdpMetrics } from '@/hooks/usePdpMetrics';

export interface LiveViewersBadgeProps {
  bookId: string;
  slug?: string;
  count?: number;
  className?: string;
}

/**
 * Task 41: Live Viewers Counter Badge
 * M.M Book House Malda - Realtime Engagement Flash
 * Displays: "👁️ এই মুহূর্তে ৪ জন শিক্ষার্থী এই বইটি দেখছেন"
 * Performance: Zero-blocking, fixed height, 0.000 CLS.
 */
export const LiveViewersBadge: React.FC<LiveViewersBadgeProps> = ({
  bookId,
  slug,
  count: propCount,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const { metrics } = usePdpMetrics({ bookId, slug, initialLiveViewers: propCount ?? 4 });

  const activeCount = propCount !== undefined ? propCount : metrics.liveViewers;
  const countDisplay = isBengali ? toBengaliNumerals(activeCount) : activeCount;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-xs font-semibold text-emerald-950 shadow-2xs min-h-[30px] transition-all ${className}`}
    >
      {/* Live Pulsing Beacon Dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
      </span>

      {/* Eye Icon */}
      <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />

      {/* Message Text */}
      <span className="truncate">
        {isBengali ? (
          <>
            এই মুহূর্তে <strong className="font-black text-emerald-800">{countDisplay} জন</strong> শিক্ষার্থী এই বইটি দেখছেন
          </>
        ) : (
          <>
            <strong className="font-black text-emerald-800">{countDisplay} students</strong> are viewing this book right now
          </>
        )}
      </span>
    </div>
  );
};
