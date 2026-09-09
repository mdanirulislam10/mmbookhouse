'use client';

import React from 'react';
import { Award, Flame, MapPin } from 'lucide-react';

export type RibbonBadgeVariant = 'bestseller' | 'top_choice' | 'local_popular';

interface AmazonRibbonBadgeProps {
  variant?: RibbonBadgeVariant;
  textBn?: string;
  textEn?: string;
  className?: string;
}

export function AmazonRibbonBadge({
  variant = 'bestseller',
  textBn,
  textEn,
  className = '',
}: AmazonRibbonBadgeProps) {
  let bgGradient = 'bg-gradient-to-r from-[#e47911] to-[#f08804]';
  let foldColor = 'border-t-[#9c4100]';
  let defaultTextBn = '#১ বেস্টসেলার';
  let defaultTextEn = '#1 Best Seller';
  let Icon = Award;

  if (variant === 'top_choice') {
    bgGradient = 'bg-gradient-to-r from-[#007185] to-[#008296]';
    foldColor = 'border-t-[#004855]';
    defaultTextBn = 'অ্যামাজন চয়েস';
    defaultTextEn = 'Top Choice';
    Icon = Flame;
  } else if (variant === 'local_popular') {
    bgGradient = 'bg-gradient-to-r from-[#c45500] to-[#e47911]';
    foldColor = 'border-t-[#853400]';
    defaultTextBn = 'মালদার সেরা পছন্দ';
    defaultTextEn = 'Malda Choice';
    Icon = MapPin;
  }

  const displayTextBn = textBn || defaultTextBn;
  const displayTextEn = textEn || defaultTextEn;

  return (
    <div
      className={`relative inline-flex items-center select-none shadow-sm ${className}`}
      title={displayTextEn}
    >
      {/* Main Ribbon Body */}
      <div
        className={`${bgGradient} text-white font-extrabold text-[10px] sm:text-[11px] leading-tight py-0.5 sm:py-1 pl-2 pr-2.5 rounded-r-xs flex items-center gap-1 shadow-xs tracking-tight`}
      >
        <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200 flex-shrink-0" />
        <span className="font-bengali">{displayTextBn}</span>
      </div>

      {/* Ribbon Fold Bottom Shadow (Folded ribbon corner effect) */}
      <div
        className={`absolute -bottom-[3px] left-0 w-0 h-0 border-t-[3px] border-l-[3px] border-l-transparent ${foldColor}`}
        aria-hidden="true"
      />
    </div>
  );
}
