'use client';

import React from 'react';
import { Tag, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Coupon } from '@/types/cart';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { AVAILABLE_COUPONS } from '@/lib/data/couponData';
import { AppLanguage } from '@/types/header';

export interface AvailableCouponsPillsProps {
  /**
   * Optional custom coupon list. Defaults to standard AVAILABLE_COUPONS catalog.
   */
  coupons?: Coupon[];

  /**
   * Code of currently active/applied coupon, or null.
   */
  appliedCouponCode?: string | null;

  /**
   * 1-Click callback triggered when a pill tag is clicked.
   */
  onSelectCoupon: (code: string) => void;

  /**
   * Optional cart subtotal to show qualification status.
   */
  subtotal?: number;

  /**
   * Language override ('bn' | 'en').
   */
  language?: AppLanguage;

  /**
   * Disable buttons during in-flight network request.
   */
  isLoading?: boolean;

  /**
   * Additional Tailwind classes.
   */
  className?: string;
}

/**
 * Task 34: 1-Click Available Coupon Pill Tags (`AvailableCouponsPills.tsx`)
 *
 * Displays clickable coupon pills with discount badges and mini descriptions,
 * allowing customers to apply high-value promotional codes with a single click.
 */
export const AvailableCouponsPills: React.FC<AvailableCouponsPillsProps> = ({
  coupons = AVAILABLE_COUPONS,
  appliedCouponCode,
  onSelectCoupon,
  subtotal,
  language: langOverride,
  isLoading = false,
  className = '',
}) => {
  const { language: contextLang } = useLanguage();
  const activeLanguage = langOverride ?? contextLang;
  const isBengali = activeLanguage === 'bn';

  const normalizedAppliedCode = appliedCouponCode ? appliedCouponCode.trim().toUpperCase() : null;

  const getDiscountBadgeText = (coupon: Coupon): string => {
    if (coupon.type === 'FREE_SHIPPING') {
      return isBengali ? 'ফ্রি ডেলিভারি' : 'Free Delivery';
    }
    if (coupon.type === 'FLAT') {
      return isBengali ? `₹${toBengaliNumerals(coupon.value)} ছাড়` : `₹${coupon.value} Off`;
    }
    return isBengali ? `${toBengaliNumerals(coupon.value)}% ছাড়` : `${coupon.value}% Off`;
  };

  return (
    <div
      data-testid="available-coupons-pills"
      className={`space-y-2.5 ${className}`}
      aria-label={isBengali ? 'উপলব্ধ কুপন ও প্রমো কোড' : 'Available coupons and promo codes'}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{isBengali ? 'উপলব্ধ প্রমো কোড (১-ক্লিকে প্রয়োগ করুন):' : 'Available Coupons (1-Click Apply):'}</span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {coupons.length} {isBengali ? 'টি অফার' : 'offers'}
        </span>
      </div>

      <div
        role="list"
        aria-label={isBengali ? 'কুপন তালিকা' : 'Coupons list'}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {coupons.map((coupon) => {
          const isApplied = normalizedAppliedCode === coupon.code.toUpperCase();
          const badgeText = getDiscountBadgeText(coupon);
          const isQualified = typeof subtotal === 'number' ? subtotal >= coupon.minOrderValue : true;

          return (
            <button
              key={coupon.code}
              role="listitem"
              type="button"
              disabled={isApplied || isLoading}
              onClick={() => onSelectCoupon(coupon.code)}
              aria-label={`${coupon.code} ${isApplied ? (isBengali ? 'প্রযুক্ত' : 'Applied') : (isBengali ? 'প্রয়োগ করুন' : 'Apply')}`}
              aria-pressed={isApplied}
              className={`group text-left p-2.5 rounded-xl border transition-all relative overflow-hidden select-none cursor-pointer ${
                isApplied
                  ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200 cursor-default shadow-xs'
                  : 'bg-white hover:bg-amber-50/50 border-gray-200 hover:border-amber-300 hover:shadow-2xs active:scale-[0.99]'
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {/* Header: Code & Discount Badge */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isApplied ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                  </div>
                  <span className="font-mono font-black text-xs sm:text-sm tracking-wider uppercase text-gray-900 group-hover:text-amber-800">
                    {coupon.code}
                  </span>
                </div>

                {/* Discount Badge */}
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    isApplied
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-amber-100 text-amber-900 border border-amber-200/80'
                  }`}
                >
                  {badgeText}
                </span>
              </div>

              {/* Mini Description */}
              <p className="text-[11px] text-gray-600 dark:text-gray-400 font-bengali line-clamp-1 mt-1 leading-snug">
                {isBengali ? coupon.descriptionBn : coupon.description}
              </p>

              {/* Action Prompt / Applied Confirmation */}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 text-[10px] font-semibold">
                {isApplied ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-bengali">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isBengali ? 'প্রযুক্ত রয়েছে' : 'Active / Applied'}</span>
                  </span>
                ) : (
                  <>
                    <span className="text-gray-400 font-bengali">
                      {coupon.minOrderValue > 0
                        ? isBengali
                          ? `মিনিমাম অর্ডার: ₹${toBengaliNumerals(coupon.minOrderValue)}`
                          : `Min order: ₹${coupon.minOrderValue}`
                        : isBengali
                        ? 'কোনো ন্যূনতম অর্ডার নেই'
                        : 'No min. order'}
                    </span>
                    <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>{isBengali ? 'প্রয়োগ করুন' : 'Apply'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableCouponsPills;
