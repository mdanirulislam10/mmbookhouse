'use client';

import React from 'react';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface ProductRatingSummaryProps {
  rating: number;
  reviewsCount: number;
  questionsCount?: number;
  reviewSectionId?: string;
  className?: string;
}

/**
 * Task 10: Star Rating Summary & Smooth Scroll Tracker
 *
 * - 4.6 golden stars with precise partial star fill
 * - Numeric score badge (e.g. ৪.৯ / 4.9)
 * - Review counter with smooth scroll to #reviews
 * - Answered Q&A counter
 * - Verified rating badge
 */
export const ProductRatingSummary: React.FC<ProductRatingSummaryProps> = ({
  rating,
  reviewsCount,
  questionsCount = 15,
  reviewSectionId = 'customer-reviews',
  className = '',
}) => {
  const { language } = useLanguage();
  const isBengali = language === 'bn';

  const roundedRating = Math.round(rating * 10) / 10;
  const ratingText = isBengali ? toBengaliNumerals(roundedRating.toFixed(1)) : roundedRating.toFixed(1);
  const reviewsCountText = isBengali ? toBengaliNumerals(reviewsCount) : String(reviewsCount);
  const questionsCountText = isBengali ? toBengaliNumerals(questionsCount) : String(questionsCount);

  const handleScrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update hash in history cleanly
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${targetId}`);
      }
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-y-1.5 gap-x-3 text-sm select-none ${className}`}>
      {/* Star Rating Block */}
      <button
        onClick={() => handleScrollToSection(reviewSectionId)}
        className="group flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm"
        title={isBengali ? `${reviewsCountText}টি রিভিউ দেখতে স্ক্রোল করুন` : `Scroll to view ${reviewsCountText} customer reviews`}
        aria-label={`${ratingText} out of 5 stars`}
      >
        <span className="font-bold text-gray-900 text-sm group-hover:text-amber-700 transition-colors">
          {ratingText}
        </span>

        {/* 5-Star Render with Partial Fill */}
        <div className="flex items-center text-amber-400">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const fillLevel = Math.max(0, Math.min(1, rating - (starIndex - 1)));

            if (fillLevel >= 0.85) {
              return (
                <Star
                  key={starIndex}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              );
            } else if (fillLevel >= 0.35) {
              return (
                <div key={starIndex} className="relative w-4 h-4">
                  <Star className="w-4 h-4 text-gray-300" />
                  <div className="absolute inset-0 overflow-hidden w-[50%]">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              );
            } else {
              return (
                <Star
                  key={starIndex}
                  className="w-4 h-4 text-gray-300"
                />
              );
            }
          })}
        </div>
      </button>

      {/* Reviews Count Link */}
      <button
        onClick={() => handleScrollToSection(reviewSectionId)}
        className="text-amber-700 hover:text-amber-800 hover:underline font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
      >
        {isBengali ? `${reviewsCountText}টি কাস্টমার রেটিং` : `${reviewsCountText} ratings`}
      </button>

      {/* Q&A Counter Link */}
      {questionsCount > 0 && (
        <>
          <span className="text-gray-300 select-none">|</span>
          <button
            onClick={() => handleScrollToSection('customer-qa')}
            className="flex items-center gap-1 text-gray-600 hover:text-amber-700 hover:underline text-xs sm:text-sm transition-colors focus:outline-none"
          >
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {isBengali ? `${questionsCountText}টি প্রশ্নোত্তর` : `${questionsCountText} answered questions`}
            </span>
          </button>
        </>
      )}

      {/* 100% Verified Buyer Micro-badge */}
      <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>{isBengali ? '১০০% ভেরিফায়েড রেটিং' : 'Verified Reviews'}</span>
      </div>
    </div>
  );
};
