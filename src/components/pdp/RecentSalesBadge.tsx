'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { usePdpMetrics } from '@/hooks/usePdpMetrics';

export interface RecentSalesBadgeProps {
  bookId: string;
  slug?: string;
  salesCount?: number;
  region?: string;
  className?: string;
}

/**
 * Task 42: Recent Sales Social Proof Badge
 * M.M Book House Malda - Recent Sales Social Proof
 * Displays: "🔥 গত ২৪ ঘণ্টায় মালদা ও সংলগ্ন জেলায় ১৪ কপি বিক্রি হয়েছে"
 * English: "🔥 14 copies sold in Malda & neighbouring districts in the last 24 hours"
 * Performance: Zero-blocking, fixed height, 0.000 CLS.
 */
export const RecentSalesBadge: React.FC<RecentSalesBadgeProps> = ({
  bookId,
  slug,
  salesCount: propSalesCount,
  region: propRegion,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const { metrics } = usePdpMetrics({ bookId, slug, initialRecentSales: propSalesCount ?? 14 });

  const activeSales = propSalesCount !== undefined ? propSalesCount : metrics.recentSales24h;
  const countDisplay = isBengali ? toBengaliNumerals(activeSales) : activeSales;
  const regionDisplay = isBengali
    ? (propRegion || metrics.salesRegion || 'মালদা ও সংলগ্ন জেলায়')
    : (propRegion || metrics.salesRegionEn || 'Malda & neighbouring districts');

  return (
    <div
      role="status"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/90 text-xs font-semibold text-amber-950 shadow-2xs min-h-[30px] transition-all ${className}`}
    >
      <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500 shrink-0" aria-hidden="true" />

      <span className="truncate">
        {isBengali ? (
          <>
            গত ২৪ ঘণ্টায় {regionDisplay} <strong className="font-black text-orange-800">{countDisplay} কপি</strong> বিক্রি হয়েছে
          </>
        ) : (
          <>
            <strong className="font-black text-orange-800">{countDisplay} copies</strong> sold in {regionDisplay} in the last 24 hours
          </>
        )}
      </span>
    </div>
  );
};
