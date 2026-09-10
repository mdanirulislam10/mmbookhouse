'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

export interface ProductTitleHeaderProps {
  title: string;
  titleBn?: string;
  edition?: string;
  binding?: string;
  condition?: 'new' | 'used';
  badge?: string;
  recommendedBadge?: string;
  className?: string;
}

/**
 * Task 8: Structured Title Header & Edition Badge
 *
 * - Semantic <h1> primary title (Bengali & English)
 * - Stylish edition badge: e.g. "[বাংলা মাধ্যম] ২০২৬ পরিমার্জিত সংস্করণ"
 * - Binding tag & condition indicators
 * - Authority / recommendation badges
 */
export const ProductTitleHeader: React.FC<ProductTitleHeaderProps> = ({
  title,
  titleBn,
  edition,
  binding,
  condition = 'new',
  badge,
  recommendedBadge,
  className = '',
}) => {
  const { language } = useLanguage();

  const isBengali = language === 'bn';
  const mainTitle = isBengali ? (titleBn || title) : title;
  const secondaryTitle = isBengali ? (titleBn ? title : null) : (titleBn || null);

  return (
    <div className={`space-y-2 select-text ${className}`}>
      {/* Top Badges Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {badge && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-xs">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        )}

        {edition && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BookOpen className="w-3 h-3 text-emerald-600" />
            {edition}
          </span>
        )}

        {binding && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
            {binding}
          </span>
        )}

        {condition === 'used' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
            {isBengali ? 'পুরাতন বই (Used)' : 'Used Book'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            {isBengali ? 'নতুন বই (Brand New)' : 'Brand New'}
          </span>
        )}
      </div>

      {/* Semantic Main Title <h1> */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-snug">
        {mainTitle}
      </h1>

      {/* Secondary Bilingual Title */}
      {secondaryTitle && (
        <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
          {secondaryTitle}
        </p>
      )}

      {/* Recommended / Authority Badge */}
      {recommendedBadge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-xs font-medium text-amber-900 mt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>{recommendedBadge}</span>
        </div>
      )}
    </div>
  );
};
