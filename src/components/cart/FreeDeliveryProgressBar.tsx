'use client';

import React from 'react';
import { Truck, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCartSubtotal } from '@/hooks/useCartStore';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { AppLanguage } from '@/types/header';

export interface FreeDeliveryProgressBarProps {
  /**
   * Cart subtotal amount in INR. If omitted, automatically tracks `useCartSubtotal()`.
   */
  subtotal?: number;

  /**
   * Target threshold for free delivery in INR (default ₹499).
   */
  threshold?: number;

  /**
   * Optional manual override for language ('bn' | 'en'). Defaults to active app language.
   */
  language?: AppLanguage;

  /**
   * Additional Tailwind classes for container.
   */
  className?: string;

  /**
   * Compact display mode for small widgets or slide-over mini-carts.
   */
  compact?: boolean;

  /**
   * Toggle min/max labels below progress bar (default true).
   */
  showLabels?: boolean;
}

/**
 * Task 31: Animated Free Delivery Progress Bar (`FreeDeliveryProgressBar.tsx`)
 *
 * Provides dynamic threshold tracking, smooth animated visual progress,
 * dynamic bilingual messaging with Bengali numerals, truck pulse animation,
 * emerald green unlock celebrations, and accessible ARIA attributes.
 */
export const FreeDeliveryProgressBar: React.FC<FreeDeliveryProgressBarProps> = ({
  subtotal,
  threshold = 499,
  language: langOverride,
  className = '',
  compact = false,
  showLabels = true,
}) => {
  const cartSubtotal = useCartSubtotal();
  const { language: contextLang } = useLanguage();

  const activeLanguage = langOverride ?? contextLang;
  const isBengali = activeLanguage === 'bn';

  // Determine current subtotal (explicit prop takes precedence over store subtotal)
  const currentSubtotal = typeof subtotal === 'number' ? Math.max(0, subtotal) : cartSubtotal;

  const isUnlocked = currentSubtotal >= threshold;
  const amountNeeded = Math.max(0, threshold - currentSubtotal);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentSubtotal / threshold) * 100)));

  // Formatted amount needed
  const formattedAmountNeeded = isBengali
    ? toBengaliNumerals(amountNeeded)
    : amountNeeded.toLocaleString('en-IN');

  const formattedThreshold = formatINR(threshold, activeLanguage);
  const formattedCurrent = formatINR(currentSubtotal, activeLanguage);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isUnlocked
          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200 shadow-xs'
          : 'bg-amber-50/70 border-amber-200 shadow-2xs'
      } ${compact ? 'p-2.5 text-xs' : 'p-3.5 text-sm'} ${className}`}
      data-testid="free-delivery-progress-container"
    >
      {/* Header banner & bilingual message */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isUnlocked
                ? 'bg-emerald-100 text-emerald-700 shadow-inner'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isUnlocked ? (
              <div className="relative flex items-center justify-center">
                <Truck className="w-4 h-4 text-emerald-700" />
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-800 absolute -bottom-1 -right-1 bg-white rounded-full" />
              </div>
            ) : (
              <Truck className="w-4 h-4 text-amber-700 animate-pulse" />
            )}
          </div>

          <div className="leading-snug">
            {isUnlocked ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-emerald-900 font-bengali">
                  {isBengali
                    ? 'অভিনন্দন! এই অর্ডারে আপনি পাচ্ছেন সম্পূর্ণ ফ্রি ডেলিভারি!'
                    : "Congratulations! You've unlocked FREE Delivery on this order!"}
                </span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              </div>
            ) : (
              <div className="text-gray-800 font-bengali">
                {isBengali ? (
                  <span>
                    আর মাত্র{' '}
                    <strong className="font-extrabold text-[#b12704] font-mono text-[1.05em]">
                      ₹{formattedAmountNeeded}
                    </strong>
                    -এর বই কিনলেই পাচ্ছেন{' '}
                    <span className="font-bold text-emerald-700">সম্পূর্ণ ফ্রি ডেলিভারি!</span>
                  </span>
                ) : (
                  <span>
                    Add{' '}
                    <strong className="font-extrabold text-[#b12704] font-mono text-[1.05em]">
                      ₹{formattedAmountNeeded}
                    </strong>{' '}
                    more to get{' '}
                    <span className="font-bold text-emerald-700">FREE Delivery!</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Threshold target pill */}
        <div className="shrink-0 text-right">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-2xs ${
              isUnlocked
                ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                : 'bg-white text-gray-700 border-amber-200'
            }`}
          >
            {isUnlocked
              ? isBengali
                ? 'ফ্রি ডেলিভারি সক্রিয়'
                : 'Unlocked'
              : isBengali
              ? `লক্ষ্য: ${formattedThreshold}`
              : `Goal: ${formattedThreshold}`}
          </span>
        </div>
      </div>

      {/* Progress Track & Fill with ARIA role */}
      <div className="mt-2.5">
        <div
          role="progressbar"
          aria-valuenow={Math.min(currentSubtotal, threshold)}
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-label={isBengali ? 'ফ্রি ডেলিভারি প্রগ্রেস বার' : 'Free delivery progress bar'}
          aria-valuetext={
            isUnlocked
              ? isBengali
                ? 'সম্পূর্ণ ফ্রি ডেলিভারি আনলক করা হয়েছে'
                : 'Free delivery unlocked'
              : isBengali
              ? `ফ্রি ডেলিভারির জন্য আরও ₹${formattedAmountNeeded} প্রয়োজন`
              : `Add ₹${formattedAmountNeeded} more for free delivery`
          }
          className="w-full h-2.5 bg-gray-200/90 rounded-full overflow-hidden shadow-inner relative"
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${
              isUnlocked
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shimmer light bar effect */}
            <div className="absolute inset-0 bg-white/25 w-full h-full opacity-60 animate-pulse pointer-events-none" />
          </div>
        </div>

        {/* Range Labels */}
        {showLabels && (
          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium mt-1 font-mono">
            <span>{formattedCurrent}</span>
            <span
              className={`font-bold ${
                isUnlocked ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isBengali ? `${toBengaliNumerals(progressPercent)}%` : `${progressPercent}%`}
            </span>
            <span>{formattedThreshold}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeDeliveryProgressBar;
