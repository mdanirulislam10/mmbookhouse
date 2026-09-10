'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface EditionBadgeProps {
  edition?: string;
  publicationYear?: number | string;
  className?: string;
  showDetails?: boolean;
}

/**
 * Task 43: "2026 Latest Revised Edition" Verified Edition Badge
 * Reassures aspirants that they are purchasing the genuine, 100% updated syllabus edition.
 */
export const EditionBadge: React.FC<EditionBadgeProps> = ({
  edition = '২০২৬ পরিমার্জিত সংস্করণ (Revised)',
  publicationYear = 2026,
  className = '',
  showDetails = true,
}) => {
  const { isBengali } = useLanguage();

  return (
    <div
      className={`inline-flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/50 border border-emerald-300/80 shadow-2xs ${className}`}
      title={
        isBengali
          ? 'নতুন সিলেবাস অনুযায়ী ১০০% হালনাগাদ ও নির্ভুল মুদ্রণ গ্যারান্টি'
          : '100% verified latest revised edition aligned with updated syllabus'
      }
    >
      <div className="flex items-center gap-1.5">
        <span className="p-1 rounded-full bg-emerald-600 text-white shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>

        <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight flex items-center gap-1">
          <span>{edition}</span>
          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium sm:border-l sm:border-emerald-300/60 sm:pl-2.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            {isBengali
              ? 'নতুন সিলেবাসের নির্ভুল মুদ্রণ'
              : '100% Updated Syllabus Guarantee'}
          </span>
        </div>
      )}
    </div>
  );
};
