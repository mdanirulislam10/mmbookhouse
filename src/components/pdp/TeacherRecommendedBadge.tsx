'use client';

import React from 'react';
import { Award, GraduationCap, CheckCircle2, Star } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface TeacherRecommendedBadgeProps {
  badgeText?: string;
  className?: string;
  variant?: 'banner' | 'pill' | 'compact';
}

/**
 * Task 45: Teacher & WBCS Topper Recommended Authority Badge
 * "উত্তরবঙ্গের বিশিষ্ট শিক্ষকমণ্ডলী ও WBCS সফল টপারদের দ্বারা সুপারিশকৃত"
 */
export const TeacherRecommendedBadge: React.FC<TeacherRecommendedBadgeProps> = ({
  badgeText = 'উত্তরবঙ্গের বিশিষ্ট শিক্ষকমণ্ডলী ও WBCS সফল টপারদের দ্বারা সুপারিশকৃত',
  className = '',
  variant = 'banner',
}) => {
  const { isBengali } = useLanguage();

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 border border-amber-300 text-amber-950 text-xs font-bold shadow-2xs ${className}`}
      >
        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="truncate">{badgeText}</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs font-semibold text-amber-900 ${className}`}>
        <div className="p-1 rounded-md bg-amber-100 text-amber-800">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <span>{badgeText}</span>
      </div>
    );
  }

  // Full Banner
  return (
    <div
      className={`p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#fff8e1] via-[#fffbf2] to-[#fff3e0] border border-amber-300/80 shadow-2xs flex items-start sm:items-center gap-3 select-none ${className}`}
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
        <Award className="w-5 h-5 stroke-[2.2]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
            {isBengali ? 'সোশ্যাল প্রুফ ও অথরিটি' : 'Authority Endorsement'}
          </span>
          <div className="flex items-center text-amber-500">
            <Star className="w-3 h-3 fill-amber-400" />
            <Star className="w-3 h-3 fill-amber-400" />
            <Star className="w-3 h-3 fill-amber-400" />
            <Star className="w-3 h-3 fill-amber-400" />
            <Star className="w-3 h-3 fill-amber-400" />
          </div>
        </div>

        <p className="text-xs sm:text-sm font-bold text-gray-950 leading-snug">
          {badgeText}
        </p>

        <p className="text-[11px] text-amber-900/80 mt-0.5 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            {isBengali
              ? 'মালদা, উত্তর ও দক্ষিণ দিনাজপুর এবং শিলিগুড়ির শীর্ষ কোচিং শিক্ষক প্যানেল দ্বারা পরীক্ষিত'
              : 'Endorsed by senior civil services faculties across North Bengal'}
          </span>
        </p>
      </div>
    </div>
  );
};
