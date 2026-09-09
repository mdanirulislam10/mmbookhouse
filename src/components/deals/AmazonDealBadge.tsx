'use client';

import React from 'react';
import { Sparkles, Zap, Flame, Gift, Bell } from 'lucide-react';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { DealType } from '@/types/deal';

interface AmazonDealBadgeProps {
  discountPercentage?: number;
  dealType?: DealType;
  customLabel?: string;
  isExpired?: boolean;
  isUpcoming?: boolean;
  className?: string;
}

/**
 * Task 22 & 26: High-Contrast Amazon Discount Badge System & Deal Categories
 * Renders bold white text on Amazon signature crimson-red background (#cc0c39)
 * and category-specific themed pill badges.
 */
export const AmazonDealBadge: React.FC<AmazonDealBadgeProps> = ({
  discountPercentage,
  dealType = 'deal_of_the_day',
  customLabel,
  isExpired = false,
  isUpcoming = false,
  className = '',
}) => {
  if (isExpired) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-bengali bg-gray-500 text-white shadow-xs ${className}`}
      >
        <span>অফার শেষ</span>
      </span>
    );
  }

  if (isUpcoming) {
    return (
      <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
        {discountPercentage && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-tight bg-amber-600 text-white shadow-xs font-bengali">
            {toBengaliNumerals(discountPercentage)}% ছাড়
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 shadow-2xs font-bengali">
          <Bell className="w-3 h-3 text-amber-600 animate-bounce" />
          <span>{customLabel || 'শীঘ্রই আসছে'}</span>
        </span>
      </div>
    );
  }

  const getDealTypeBadge = () => {
    switch (dealType) {
      case 'lightning_deal':
        return {
          text: 'লাইটনিং ডিল',
          subText: 'Lightning Deal',
          icon: Zap,
          badgeColor: 'text-[#cc0c39] bg-rose-50 border-rose-200',
          iconColor: 'text-[#cc0c39]',
        };
      case 'weekend_special':
        return {
          text: 'উইকএন্ড স্পেশাল',
          subText: 'Weekend Special',
          icon: Gift,
          badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
          iconColor: 'text-purple-600',
        };
      case 'limited_time':
        return {
          text: 'সীমিত সময়',
          subText: 'Limited time deal',
          icon: Flame,
          badgeColor: 'text-orange-700 bg-orange-50 border-orange-200',
          iconColor: 'text-orange-600',
        };
      case 'deal_of_the_day':
      default:
        return {
          text: 'আজকের সেরা ডিল',
          subText: 'Deal of the Day',
          icon: Sparkles,
          badgeColor: 'text-[#cc0c39] bg-rose-50 border-rose-200',
          iconColor: 'text-[#cc0c39]',
        };
    }
  };

  const badgeInfo = getDealTypeBadge();
  const Icon = badgeInfo.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* High-Contrast Amazon Crimson Red Discount Percentage Badge */}
      {discountPercentage && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-tight bg-[#cc0c39] text-white shadow-xs font-bengali">
          {toBengaliNumerals(discountPercentage)}% ছাড়
        </span>
      )}

      {/* Signature Label Badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border shadow-2xs font-bengali ${badgeInfo.badgeColor}`}>
        <Icon className={`w-3 h-3 ${badgeInfo.iconColor}`} />
        <span>{customLabel || badgeInfo.text}</span>
      </span>
    </div>
  );
};

